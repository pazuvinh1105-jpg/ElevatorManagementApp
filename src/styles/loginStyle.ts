import {StyleSheet} from 'react-native';

export default StyleSheet.create({

  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(235, 246, 255, 0.55)',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },

  logo: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    marginBottom: 12,
  },

  appTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#123F91',
    textAlign: 'center',
  },

  appSubtitle: {
    fontSize: 13,
    color: '#7185A5',
    textAlign: 'center',
    marginTop: 3,
  },

  loginHeader: {
    marginTop: 26,
    marginBottom: 17,
  },

  loginTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#123F91',
    marginBottom: 5,
  },

  welcomeText: {
    fontSize: 15,
    color: '#61789F',
    marginBottom: 3,
  },

  description: {
    fontSize: 12,
    color: '#7185A5',
    lineHeight: 18,
  },

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#C8DDF5',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  inputIcon: {
    width: 45,
    textAlign: 'center',
    fontSize: 22,
    color: '#647FA6',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#243B5A',
  },

  eyeButton: {
    width: 45,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eyeIcon: {
    fontSize: 21,
    color: '#647FA6',
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#087FEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,

    elevation: 3,
    shadowColor: '#087FEA',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    color: '#087FEA',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 28,
  },
  footerSubtitle: {
   textAlign: 'center',
   color: '#087FEA',
   fontSize: 13,
   fontWeight: '600',
   marginTop: 3,
},
});
