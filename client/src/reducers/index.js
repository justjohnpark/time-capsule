import { combineReducers } from 'redux';
import { LOAD_WEB3, LOAD_CONTRACT, LOAD_CURRENT_ADDRESS, LOAD_ACCOUNTS, LOAD_IMAGE, SET_ENTRY_COUNT, SET_SEBID, SET_TABLE_BODY } from '../actions/types';

const web3Reducer = (state = {}, action) => {
  if (action.type === 'LOAD_WEB3') {
    return { ...state, web3: action.payload }
  }

  return state
};

const contractReducer = (state = {}, action) => {
  if (action.type === 'LOAD_CONTRACT') {
    return { ...state, contract: action.payload }
  }

  return state
};

const currentAddressReducer = (state = {}, action) => {
  if (action.type === 'LOAD_CURRENT_ADDRESS') {
    return action.payload
  }

  return ''
};

const accountsReducer = (state = {}, action) => {
  if (action.type === 'LOAD_ACCOUNTS') {
    return { ...state, accounts: action.payload }
  }

  return state;
};

const imageReducer = (state = {}, action) => {
  if (action.type === 'LOAD_IMAGE') {
    return { ...state, image: action.payload }
  }

  return state;
};

const sebidReducer = (state = {}, action) => {
  if (action.type === 'SET_SEBID') {
    return { ...state, sebid: action.payload }
  }

  return state;
};

const tableBodyReducer = (state = {}, action) => {
  if (action.type === 'SET_TABLE_BODY') {
    return { ...state, tableBody: action.payload }
  }

  return state;
};

export default combineReducers({
  web3: web3Reducer,
  contract: contractReducer,
  currentAddress: currentAddressReducer,
  accounts: accountsReducer,
  image: imageReducer,
  sebid: sebidReducer,
  tableBody: tableBodyReducer,
});