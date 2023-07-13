import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import { getRequest, postRequest } from 'src/helpers/axiosHelper';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...(
        // if payload (user) is provided, then is authenticated
        user
          ? ({
            isAuthenticated: true,
            isLoading: false,
            user
          })
          : ({
            isLoading: false
          })
      )
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const initialize = async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current) {
      return;
    }
    console.log('initialize');

    initialized.current = true;

    let isAuthenticated = false;

    try {
      isAuthenticated = window.sessionStorage.getItem('authenticated') === 'true';
    } catch (err) {
      console.error(err);
    }

    if (isAuthenticated) {
      try {
        let session = window.sessionStorage.getItem('session');
        if (session) {
          const sessionData = JSON.parse(session);
          dispatch({
            type: HANDLERS.INITIALIZE,
            payload: sessionData.user
          });
          checkToken(sessionData.token);
        } else {
          dispatch({
            type: HANDLERS.INITIALIZE
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      dispatch({
        type: HANDLERS.INITIALIZE
      });
    }
  };

  useEffect(
    () => {
      initialize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const skip = () => {
    try {
      window.sessionStorage.setItem('authenticated', 'true');
    } catch (err) {
      console.error(err);
    }

    const user = {
      id: '5e86809283e28b96d2d38537',
      avatar: '/assets/avatars/avatar-anika-visser.png',
      name: 'Anika Visser',
      email: 'anika.visser@devias.io'
    };

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signIn = async (email, password) => {
    const response = await postRequest({
      url: '/auth/login',
      body: {
          email: email,
          password: password,
          service: process.env.NEXT_PUBLIC_SERVICE_NAME
      }
    }).then(res => {
        return res;
    });

    if (!response.error && response.data && response.data.authorization_token) {        
        const token = response.data.authorization_token;

        checkToken(token);

        return {
            success: true,
            token: token
        };
    } else {
      throw new Error(response?.errorMessage || 'Something went wrong get contact');
    }
  };

  const signUp = async (email, name, password) => {
    throw new Error('Sign up is not implemented');
  };

  const signOut = () => {
    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  const checkToken = async (optionalToken = undefined) => {
    const ignoreUrls = process.env.REACT_APP_IGNORE_URLS;

    // To make public accessible pages by environment variable
    if (ignoreUrls && ignoreUrls.split(',').some(ignorePathe => window.location.pathname.includes(ignorePathe))) {
        return;
    }

    // if (isPermissionLoaded) {
    //     return;
    // }

    if (optionalToken) {
        const response = await getRequest({
            url: '/auth/permissions?is_debug=true',
            token: optionalToken
        });

        if (response.error) {
            dispatch({
              type: HANDLERS.SIGN_OUT
            });
        } else {
            console.log('response login', response);
            try {
              window.sessionStorage.setItem('authenticated', 'true');
              window.sessionStorage.setItem('session', JSON.stringify({...response.data, token: optionalToken}));
            } catch (err) {
              console.error(err);
            }
            const user = response.data.user;
            user['permissions'] = response.data.permissions;
        
            dispatch({
              type: HANDLERS.SIGN_IN,
              payload: user
            });
        }
    } else {
        handleRedirectUrl();
        navigate('/sign-in');
    }
}

  return (
    <AuthContext.Provider
      value={{
        ...state,
        skip,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
