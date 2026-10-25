const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const webApiKey = defineSecret('FIREBASE_WEB_API_KEY');
const getWebApiKey = () =>
  process.env.FIREBASE_WEB_API_KEY || webApiKey.value();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '12mb' }));

const clean = data =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
const docs = snapshot =>
  snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
const numericId = value =>
  /^\d+$/.test(String(value)) ? Number(value) : value;
const userEmail = username =>
  `${String(username)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')}@elevator.local`;
const fail = (res, status, message) => res.status(status).json({ message });

async function nextId(name) {
  const ref = db.collection('_counters').doc(name);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const value = (snapshot.data()?.value || 0) + 1;
    transaction.set(ref, { value }, { merge: true });
    return value;
  });
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return fail(res, 401, 'Không có token đăng nhập');
  try {
    const decoded = await auth.verifyIdToken(token);
    const profile = (
      await db.collection('users').doc(decoded.uid).get()
    ).data();
    if (!profile) return fail(res, 403, 'Tài khoản chưa được phân quyền');
    req.user = { uid: decoded.uid, ...profile };
    next();
  } catch (error) {
    console.error('Authentication failed', error);
    return fail(res, 403, 'Token không hợp lệ hoặc đã hết hạn');
  }
}

const requireAdmin = (req, res, next) =>
  req.user.role === 'admin'
    ? next()
    : fail(res, 403, 'Chỉ Admin được thực hiện thao tác này');

function canAccessElevator(user, elevatorId) {
  return user.role !== 'owner' || user.elevatorId === elevatorId;
}

app.get('/', (_req, res) =>
  res.json({ message: 'Elevator Management Firebase API đang hoạt động' }),
);

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password)
    return fail(res, 400, 'Thiếu tên đăng nhập hoặc mật khẩu');
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getWebApiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail(username),
          password,
          returnSecureToken: true,
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) return fail(res, 401, 'Sai tài khoản hoặc mật khẩu');
    const profile = (
      await db.collection('users').doc(result.localId).get()
    ).data();
    if (!profile) return fail(res, 403, 'Tài khoản chưa được phân quyền');
    res.json({
      message: 'Đăng nhập thành công',
      token: result.idToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: { id: result.localId, ...profile },
    });
  } catch (error) {
    console.error(error);
    fail(res, 500, 'Không thể đăng nhập');
  }
});

app.get('/users', authenticate, requireAdmin, async (_req, res) => {
  const snapshot = await db.collection('users').get();
  res.json(
    snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
      ),
  );
});

app.post('/users', authenticate, requireAdmin, async (req, res) => {
  const { username, password, role, employeeId, elevatorId } = req.body;
  if (
    !username?.trim() ||
    !password ||
    !['technician', 'owner'].includes(role) ||
    (role === 'technician' && !employeeId?.trim()) ||
    (role === 'owner' && !elevatorId?.trim())
  )
    return fail(res, 400, 'Thông tin tài khoản không hợp lệ');
  if (
    role === 'owner' &&
    !(await db.collection('elevators').doc(elevatorId.trim()).get()).exists
  )
    return fail(res, 400, 'Thang máy không tồn tại');
  try {
    const account = await auth.createUser({
      email: userEmail(username),
      password,
      displayName: username.trim(),
    });
    const profile = clean({
      username: username.trim(),
      role,
      employeeId: role === 'technician' ? employeeId.trim() : null,
      elevatorId: role === 'owner' ? elevatorId.trim() : null,
      createdAt: new Date().toISOString(),
    });
    await Promise.all([
      db.collection('users').doc(account.uid).set(profile),
      auth.setCustomUserClaims(account.uid, { role }),
    ]);
    res.status(201).json({ message: 'Đã tạo tài khoản', id: account.uid });
  } catch (error) {
    fail(
      res,
      error.code === 'auth/email-already-exists' ? 400 : 500,
      error.code === 'auth/email-already-exists'
        ? 'Username đã tồn tại'
        : 'Không thể tạo tài khoản',
    );
  }
});

app.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { role, employeeId, elevatorId } = req.body;
  if (
    !['technician', 'owner'].includes(role) ||
    (role === 'technician' && !employeeId?.trim()) ||
    (role === 'owner' && !elevatorId?.trim())
  )
    return fail(res, 400, 'Thông tin phân quyền không hợp lệ');
  const ref = db.collection('users').doc(req.params.id);
  const current = await ref.get();
  if (!current.exists || current.data().role === 'admin')
    return fail(res, 404, 'Không tìm thấy tài khoản có thể phân quyền');
  if (
    role === 'owner' &&
    !(await db.collection('elevators').doc(elevatorId.trim()).get()).exists
  )
    return fail(res, 400, 'Thang máy không tồn tại');
  await Promise.all([
    ref.update({
      role,
      employeeId: role === 'technician' ? employeeId.trim() : null,
      elevatorId: role === 'owner' ? elevatorId.trim() : null,
    }),
    auth.setCustomUserClaims(req.params.id, { role }),
  ]);
  res.json({ message: 'Đã cập nhật phân quyền' });
});

const elevatorFields = [
  'elevatorId',
  'owner',
  'location',
  'city',
  'manufacturer',
  'installationDate',
  'type',
  'capacity',
  'status',
  'numberOfStops',
  'speed',
  'pitDepth',
  'overheadHeight',
  'driveType',
];
const elevatorData = body =>
  clean(
    Object.fromEntries(
      elevatorFields.map(field => [
        field,
        body[field] === '' ? null : body[field],
      ]),
    ),
  );

app.get('/elevators', authenticate, async (req, res) => {
  if (req.user.role === 'owner') {
    const snapshot = await db
      .collection('elevators')
      .doc(req.user.elevatorId)
      .get();
    return res.json(
      snapshot.exists ? [{ ...snapshot.data(), elevatorId: snapshot.id }] : [],
    );
  }
  const snapshot = await db.collection('elevators').get();
  res.json(snapshot.docs.map(doc => ({ ...doc.data(), elevatorId: doc.id })));
});

app.post('/elevators', authenticate, requireAdmin, async (req, res) => {
  if (
    !['elevatorId', 'owner', 'location', 'city'].every(field =>
      String(req.body[field] || '').trim(),
    )
  )
    return fail(
      res,
      400,
      'Vui lòng nhập mã, chủ sở hữu, địa điểm và thành phố',
    );
  const id = req.body.elevatorId.trim();
  const ref = db.collection('elevators').doc(id);
  if ((await ref.get()).exists)
    return fail(res, 400, 'Mã thang máy đã tồn tại');
  await ref.set({ ...elevatorData(req.body), elevatorId: id });
  res.status(201).json({ message: 'Đã thêm thang máy' });
});

app.put(
  '/elevators/:elevatorId',
  authenticate,
  requireAdmin,
  async (req, res) => {
    if (
      !['owner', 'location', 'city'].every(field =>
        String(req.body[field] || '').trim(),
      )
    )
      return fail(res, 400, 'Vui lòng nhập chủ sở hữu, địa điểm và thành phố');
    const ref = db.collection('elevators').doc(req.params.elevatorId);
    if (!(await ref.get()).exists)
      return fail(res, 404, 'Không tìm thấy thang máy');
    const data = elevatorData(req.body);
    delete data.elevatorId;
    await ref.update(data);
    res.json({ message: 'Đã cập nhật thang máy' });
  },
);

app.get('/elevators/:elevatorId', async (req, res) => {
  const snapshot = await db
    .collection('elevators')
    .doc(req.params.elevatorId)
    .get();
  snapshot.exists
    ? res.json({ ...snapshot.data(), elevatorId: snapshot.id })
    : fail(res, 404, 'Không tìm thấy thang máy');
});

app.get(
  '/elevators/:elevatorId/inspections',
  authenticate,
  async (req, res) => {
    if (!canAccessElevator(req.user, req.params.elevatorId))
      return fail(res, 403, 'Không có quyền xem thang máy này');
    const snapshot = await db
      .collection('inspections')
      .where('elevatorId', '==', req.params.elevatorId)
      .get();
    res.json(
      docs(snapshot)
        .map(x => ({ ...x, id: numericId(x.id) }))
        .sort((a, b) =>
          String(b.inspectionDate).localeCompare(String(a.inspectionDate)),
        ),
    );
  },
);

app.post(
  '/elevators/:elevatorId/inspections',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'technician')
      return fail(res, 403, 'Chỉ Technician mới được thêm lần kiểm định');
    const id = await nextId('inspections');
    await db
      .collection('inspections')
      .doc(String(id))
      .set(
        clean({
          elevatorId: req.params.elevatorId,
          inspectionDate: req.body.inspectionDate,
          inspectionUnit: req.body.inspectionUnit,
          result: req.body.result,
          description: req.body.description,
        }),
      );
    res.status(201).json({ message: 'Đã thêm lần kiểm định', id });
  },
);

app.get('/maintenance/checklists/:round', authenticate, async (req, res) => {
  const round = Number(req.params.round);
  if (![1, 2, 3].includes(round))
    return fail(res, 400, 'Lần bảo trì không hợp lệ');
  const snapshot = await db.collection('maintenance_checklists').get();
  const checklists = docs(snapshot)
    .map(x => ({ ...x, id: numericId(x.id) }))
    .filter(x => x.round === 0 || x.round === round)
    .sort((a, b) => Number(a.id) - Number(b.id));
  res.json({ round, total: checklists.length, checklists });
});

async function validateMaintenance(elevatorId, body) {
  const round = Number(body.round);
  if (![1, 2, 3].includes(round) || !body.date || !Array.isArray(body.results))
    return { error: 'Thông tin phiếu bảo trì không hợp lệ' };
  if (!(await db.collection('elevators').doc(elevatorId).get()).exists)
    return { error: 'Không tìm thấy thang máy', status: 404 };
  const ids = body.results.map(x => String(x.checklistId));
  if (
    new Set(ids).size !== ids.length ||
    body.results.some(x => !['pass', 'fail'].includes(x.result))
  )
    return { error: 'Danh sách kết quả checklist không hợp lệ' };
  const snapshots = await Promise.all(
    ids.map(id => db.collection('maintenance_checklists').doc(id).get()),
  );
  if (snapshots.some(x => !x.exists || ![0, round].includes(x.data().round)))
    return { error: 'Có checklist không thuộc lần bảo trì đã chọn' };
  return { round };
}

app.post(
  '/elevators/:elevatorId/maintenance',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'technician')
      return fail(res, 403, 'Chỉ Technician mới được tạo phiếu bảo trì');
    const validation = await validateMaintenance(
      req.params.elevatorId,
      req.body,
    );
    if (validation.error)
      return fail(res, validation.status || 400, validation.error);
    const id = await nextId('service_history');
    const batch = db.batch();
    batch.set(db.collection('service_history').doc(String(id)), {
      elevatorId: req.params.elevatorId,
      technicianId: req.user.employeeId || null,
      type: 'maintenance',
      date: req.body.date,
      description: req.body.description || null,
      round: validation.round,
    });
    req.body.results.forEach(item =>
      batch.set(
        db.collection('maintenance_results').doc(`${id}_${item.checklistId}`),
        {
          serviceId: id,
          checklistId: Number(item.checklistId),
          result: item.result,
        },
      ),
    );
    await batch.commit();
    res
      .status(201)
      .json({
        message: 'Đã tạo phiếu bảo trì thành công',
        serviceId: id,
        round: validation.round,
        total: req.body.results.length,
      });
  },
);

async function maintenanceDetail(elevatorId, serviceId) {
  const serviceSnapshot = await db
    .collection('service_history')
    .doc(String(serviceId))
    .get();
  if (!serviceSnapshot.exists) return null;
  const service = {
    id: numericId(serviceSnapshot.id),
    ...serviceSnapshot.data(),
  };
  if (service.elevatorId !== elevatorId || service.type !== 'maintenance')
    return null;
  const resultSnapshot = await db
    .collection('maintenance_results')
    .where('serviceId', '==', Number(serviceId))
    .get();
  const results = await Promise.all(
    resultSnapshot.docs.map(async resultDoc => {
      const result = resultDoc.data();
      const checklist =
        (
          await db
            .collection('maintenance_checklists')
            .doc(String(result.checklistId))
            .get()
        ).data() || {};
      return {
        checklistId: result.checklistId,
        ...checklist,
        result: result.result,
      };
    }),
  );
  results.sort((a, b) => Number(a.checklistId) - Number(b.checklistId));
  return {
    service: {
      ...service,
      round: service.round ?? results.find(x => x.round !== 0)?.round ?? null,
    },
    results,
  };
}

app.get(
  '/elevators/:elevatorId/maintenance/:serviceId',
  authenticate,
  async (req, res) => {
    if (!canAccessElevator(req.user, req.params.elevatorId))
      return fail(res, 403, 'Không có quyền xem thang máy này');
    const detail = await maintenanceDetail(
      req.params.elevatorId,
      req.params.serviceId,
    );
    detail ? res.json(detail) : fail(res, 404, 'Không tìm thấy phiếu bảo trì');
  },
);

app.put(
  '/elevators/:elevatorId/maintenance/:serviceId',
  authenticate,
  async (req, res) => {
    if (!['technician', 'admin'].includes(req.user.role))
      return fail(res, 403, 'Chỉ Technician hoặc Admin được sửa phiếu bảo trì');
    const current = await maintenanceDetail(
      req.params.elevatorId,
      req.params.serviceId,
    );
    if (!current) return fail(res, 404, 'Không tìm thấy phiếu bảo trì');
    const validation = await validateMaintenance(req.params.elevatorId, {
      ...req.body,
      round: current.service.round,
    });
    if (validation.error)
      return fail(res, validation.status || 400, validation.error);
    const batch = db.batch();
    batch.update(
      db.collection('service_history').doc(String(req.params.serviceId)),
      { date: req.body.date, description: req.body.description || null },
    );
    const old = await db
      .collection('maintenance_results')
      .where('serviceId', '==', Number(req.params.serviceId))
      .get();
    old.docs.forEach(doc => batch.delete(doc.ref));
    req.body.results.forEach(item =>
      batch.set(
        db
          .collection('maintenance_results')
          .doc(`${req.params.serviceId}_${item.checklistId}`),
        {
          serviceId: Number(req.params.serviceId),
          checklistId: Number(item.checklistId),
          result: item.result,
        },
      ),
    );
    await batch.commit();
    res.json({
      message: 'Đã cập nhật phiếu bảo trì thành công',
      serviceId: Number(req.params.serviceId),
      round: validation.round,
      total: req.body.results.length,
    });
  },
);

app.get('/elevators/:elevatorId/services', authenticate, async (req, res) => {
  if (!canAccessElevator(req.user, req.params.elevatorId))
    return fail(res, 403, 'Không có quyền xem thang máy này');
  const snapshot = await db
    .collection('service_history')
    .where('elevatorId', '==', req.params.elevatorId)
    .get();
  res.json(
    docs(snapshot)
      .map(x => ({ ...x, id: numericId(x.id) }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
  );
});

app.post('/elevators/:elevatorId/services', authenticate, async (req, res) => {
  if (req.user.role !== 'technician')
    return fail(res, 403, 'Chỉ Technician mới được thêm lịch sử dịch vụ');
  if (!['repair', 'replacement'].includes(req.body.type) || !req.body.date)
    return fail(res, 400, 'Thông tin dịch vụ không hợp lệ');
  const id = await nextId('service_history');
  await db
    .collection('service_history')
    .doc(String(id))
    .set({
      elevatorId: req.params.elevatorId,
      technicianId: req.user.employeeId || null,
      type: req.body.type,
      date: req.body.date,
      description: req.body.description || null,
    });
  res.status(201).json({ message: 'Đã thêm lịch sử dịch vụ', id });
});

app.get(
  '/elevators/:elevatorId/services/:serviceId',
  authenticate,
  async (req, res) => {
    if (!canAccessElevator(req.user, req.params.elevatorId))
      return fail(res, 403, 'Không có quyền xem thang máy này');
    const snapshot = await db
      .collection('service_history')
      .doc(String(req.params.serviceId))
      .get();
    const service = snapshot.exists
      ? { id: numericId(snapshot.id), ...snapshot.data() }
      : null;
    service &&
    service.elevatorId === req.params.elevatorId &&
    ['repair', 'replacement'].includes(service.type)
      ? res.json({ service })
      : fail(res, 404, 'Không tìm thấy bản ghi sửa chữa/thay thế');
  },
);

app.put(
  '/elevators/:elevatorId/services/:serviceId',
  authenticate,
  async (req, res) => {
    if (!['technician', 'admin'].includes(req.user.role))
      return fail(res, 403, 'Chỉ Technician hoặc Admin được sửa bản ghi');
    if (!req.body.date) return fail(res, 400, 'Thiếu ngày dịch vụ');
    const ref = db
      .collection('service_history')
      .doc(String(req.params.serviceId));
    const snapshot = await ref.get();
    const service = snapshot.data();
    if (
      !snapshot.exists ||
      service.elevatorId !== req.params.elevatorId ||
      !['repair', 'replacement'].includes(service.type)
    )
      return fail(res, 404, 'Không tìm thấy bản ghi sửa chữa/thay thế');
    await ref.update({
      date: req.body.date,
      description: req.body.description || null,
    });
    res.json({
      message: 'Đã cập nhật bản ghi dịch vụ',
      serviceId: numericId(req.params.serviceId),
      type: service.type,
    });
  },
);

app.post('/attachments', authenticate, async (req, res) => {
  if (!['admin', 'technician'].includes(req.user.role))
    return fail(res, 403, 'Chỉ Admin hoặc Technician được thêm file');
  const {
    recordType,
    recordId,
    fileName,
    fileUri,
    fileType,
    fileSize,
  } = req.body;
  if (
    !['inspection', 'maintenance', 'repair', 'replacement'].includes(
      recordType,
    ) ||
    !recordId ||
    !fileName ||
    !fileType ||
    !fileUri
  )
    return fail(res, 400, 'Thông tin attachment không hợp lệ');
  const id = await nextId('attachments');
  await db
    .collection('attachments')
    .doc(String(id))
    .set({
      recordType,
      recordId: Number(recordId),
      fileName,
      fileUri,
      fileType,
      fileSize: fileSize || null,
      createdAt: new Date().toISOString(),
    });
  res
    .status(201)
    .json({ message: 'Đã lưu metadata attachment', id, fileUri });
});

app.get('/attachments', authenticate, async (req, res) => {
  const { recordType, recordId } = req.query;
  if (
    !['inspection', 'maintenance', 'repair', 'replacement'].includes(
      recordType,
    ) ||
    !recordId
  )
    return fail(res, 400, 'Thiếu hoặc sai recordType/recordId');
  if (req.user.role === 'owner') {
    const sourceCollection =
      recordType === 'inspection' ? 'inspections' : 'service_history';
    const source = await db
      .collection(sourceCollection)
      .doc(String(recordId))
      .get();
    if (!source.exists || source.data().elevatorId !== req.user.elevatorId)
      return fail(res, 403, 'Không có quyền xem file này');
  }
  const snapshot = await db
    .collection('attachments')
    .where('recordType', '==', recordType)
    .where('recordId', '==', Number(recordId))
    .get();
  res.json(
    docs(snapshot)
      .map(x => ({ ...x, id: numericId(x.id) }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
  );
});

app.delete('/attachments/:id', authenticate, async (req, res) => {
  if (!['admin', 'technician'].includes(req.user.role))
    return fail(res, 403, 'Chỉ Admin hoặc Technician được xóa file');
  const ref = db.collection('attachments').doc(String(req.params.id));
  const snapshot = await ref.get();
  if (!snapshot.exists) return fail(res, 404, 'Không tìm thấy file cần xóa');
  await ref.delete();
  res.json({ message: 'Đã xóa attachment', id: numericId(req.params.id) });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  fail(res, 500, 'Lỗi hệ thống');
});

exports.api = onRequest(
  { region: 'asia-southeast1', secrets: [webApiKey], cors: true },
  app,
);

// Cho phép backend Express local dùng cùng REST API với Firestore/Auth.
exports.app = app;
