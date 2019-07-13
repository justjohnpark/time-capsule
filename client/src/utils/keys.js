import CryptoJS from 'crypto-js';
import NodeRSA from 'node-rsa';

const keys = {
  generateRandomKey() { 
		// define the characters to pick from
	  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz*&-%/!?*+=()";
	  
	  // create a key for symmetric encryption. 
	  var randomstring = '';
	  
	  for (var i=0; i < 50; i++) {
	    var rnum = Math.floor(Math.random() * chars.length);
	    randomstring += chars.substring(rnum,rnum+1);
	  }
	  
	  return randomstring;
  }, 
  generatePubPrivKeyPair() {
  	const key = new NodeRSA({b: 512});
		key.generateKeyPair();
  	
  	var publicKey = key.exportKey('pkcs1-public-pem');
  	var privateKey = key.exportKey('pkcs1-private-pem');
  	
  	return [publicKey, privateKey];
  },
  convertArrayBufferToWordArray(arrayBuffer) {
  	var wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
	  var str = CryptoJS.enc.Hex.stringify(wordArray);

	  return str;
  },
  encryptWordArray(str, key) {
  	var ct = CryptoJS.AES.encrypt(str, key);
	  var ctstr = ct.toString();

	  return ctstr;
  },
  decryptToWordArray(uintArray, key) {
  	var str = new TextDecoder("utf-8").decode(uintArray);
  	var decrypted = CryptoJS.AES.decrypt(str, key);
  	str = decrypted.toString(CryptoJS.enc.Utf8);
  	var wordArray = CryptoJS.enc.Hex.parse(str);

  	return wordArray;
  },
  convertWordArrayToArrayBuffer(wordArray) {
  	var dcBase64String = wordArray.toString(CryptoJS.enc.Base64);
    var binary_string =  window.atob(dcBase64String);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes.buffer;
  },
  // https://gist.github.com/candycode/f18ae1767b2b0aba568e
  convertArrayBufferToImage(buffer) {
    var arrayBufferView = new Uint8Array( buffer );
    var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
    var urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL( blob );
  }
}

export default keys