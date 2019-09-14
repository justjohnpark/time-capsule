export const loadWeb3 = web3 => {
  return {
    type: 'LOAD_WEB3',
    payload: web3
  };
};

export const loadContract = contract => {
  return {
    type: 'LOAD_CONTRACT',
    payload: contract
  };
};

export const loadCurrentAddress = currentAddress => {
  return {
    type: 'LOAD_CURRENT_ADDRESS',
    payload: currentAddress
  };
};

export const loadAccounts = accounts => {
  return {
    type: 'LOAD_ACCOUNTS',
    payload: accounts
  };
};

export const loadImage = image => {
  return {
    type: 'LOAD_IMAGE',
    payload: image
  };
};

export const setSebid = sebid => {
	return {
		type: 'SET_SEBID',
		payload: sebid
	}
}

export const setTableBody = tableBody => {
	return {
		type: 'SET_TABLE_BODY',
		payload: tableBody
	}
}