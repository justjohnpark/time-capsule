import NodeRSA from 'node-rsa';

import storeProvider from '../storeProvider';
import { loadImage, setSebid } from '../actions';
import ipfs from '../ipfs/ipfs';
import keys from './keys';

const util = {
  fetchSS() {
    var store = storeProvider.getStore();
    var state = store.getState();

    return {store: store, state: state};
  }, 
  updateStrippedEntriesByID(newStrippedEntry) {
    var ss = this.fetchSS();
    var store = ss.store, state = ss.state;

    var updatedSebid = {...state.sebid.sebid}
    updatedSebid[newStrippedEntry['id']] = newStrippedEntry;
    store.dispatch(setSebid(updatedSebid))
  },
  decryptIPFS(e) {
    var ss = this.fetchSS();
    var store = ss.store, state = ss.state;

    var entry = state.sebid.sebid[parseInt(e.currentTarget.getAttribute('value'))];

    ipfs.cat(entry['ipfs hash'], (err, r) => {
      let z = new NodeRSA(entry['priv_key']);
      let dcAesKey = z.decrypt(entry['ec_aes_key'], 'utf8');

      var decryptedWordArray = keys.decryptToWordArray(r, dcAesKey);
      var decryptedArrayBuffer = keys.convertWordArrayToArrayBuffer(decryptedWordArray);

      var imageUrl = keys.convertArrayBufferToImage(decryptedArrayBuffer);
      store.dispatch(loadImage(imageUrl));
    });
  },
}

export default util