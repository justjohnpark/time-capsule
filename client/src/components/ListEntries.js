import React from 'react';
import { connect } from 'react-redux';

import util from '../utils/index';
import { setSebid, setTableBody } from '../actions';

class ListEntries extends React.Component {

  constructor() {
    super()

    this.state = {
      fetchedEntries: false,
    }
  }

  componentDidMount() {
  	try {
      this.interval = setInterval(this.fetchEntries, 1000);
  	} catch (error) {
  		console.log(error);
  	}
  }

  fetchEntries = async() => {
    if (this.state.fetchedEntries === true) {
      clearInterval(this.interval);
    }

    if (this.props && this.props.contract && this.props.contract.contract) {
      var result = await this.props.contract.contract.methods.getSenderEntries().call({from: this.props.accounts.accounts[0]});

      if (result.length > 0) {
        let t = this;
      
        var tempEntry = {};

        result.forEach(entry => {
          tempEntry['id'] = entry['id'];
          tempEntry['title'] = entry['title'];
          tempEntry['ipfs hash'] = entry['ipfs'];
          tempEntry['released'] = entry['isReleased'].toString();
          tempEntry['unlockTime'] = entry['unlockTime'];

          if (entry['isReleased'].toString() === 'true') {
            tempEntry['ec_aes_key'] = entry['ec_aes_key'];
            tempEntry['priv_key'] = entry['priv_key'];
          }

          if (!t.props.sebid.sebid || !t.props.sebid.sebid[tempEntry['id']]) {
            util.updateStrippedEntriesByID(tempEntry);
          }

          tempEntry = {};
        });

        this.props.setTableBody(this.buildTableBody());
      }
      
      this.state.fetchedEntries = true;
    }
  }

  listenToReleaseEntryEvent() {
    let t = this;

    this.props.contract.contract.events.EventRelease({fromBlock: 0, toBlock: 'latest'})
      .on('data', function(event) {
        console.log(`EventRelease received: ${event} || ${event.returnValues}`);
        console.log(event.returnValues);

        let tse = t.props.sebid.sebid[event.returnValues['id']];
        if (tse) {
        	tse['released'] = 'true';
        	tse['priv_key'] = event.returnValues['priv_key'];
          tse['ec_aes_key'] = event.returnValues['ec_aes_key'];
	        util.updateStrippedEntriesByID(tse);
	        t.props.setTableBody(t.buildTableBody());
        }
      })
      .on('error', console.error);
  };

  releaseEntry = (e) => {
  	console.log(parseInt(e.currentTarget.getAttribute('value')));
    this.props.contract.contract.methods.release(parseInt(e.currentTarget.getAttribute('value'))).send({from: this.props.accounts.accounts[0]});
    this.listenToReleaseEntryEvent();
  }

  buildTableBody() {
  	let tableBody = [];
  	let sebid = this.props.sebid.sebid;

  	if (Object.keys(sebid).length > 0) {
  		for (var key in sebid) {
  			if (sebid[key]['released'] === 'true') {
  				tableBody.push(
  					<tr key={`${key}`}>
  						<td>{sebid[key]['title']}</td>
  						<td>
                <a value={key} href="#" onClick={(e) => util.decryptIPFS(e)}>
                  {sebid[key]['ipfs hash']}
                </a>
              </td>
  						<td>{sebid[key]['released']}</td>
  						<td>{new Date(parseInt(sebid[key]['unlockTime'])*1000).toUTCString()}</td>
  					</tr>
  				);
  			} else {
	  			tableBody.push(
	  				<tr key={`${key}`}>
	  					<td>{sebid[key]['title']}</td>
	  					<td>{sebid[key]['ipfs hash']}</td>
	  					<td>
                <a value={key} href="#" onClick={(e) => this.releaseEntry(e)}>
                  {sebid[key]['released']}
                </a>
              </td>
              <td>{new Date(parseInt(sebid[key]['unlockTime'])*1000).toUTCString()}</td>
	  				</tr>
	  			);
  			}
  		}
  	}

  	return tableBody;
  }

  displayImage() {
    if (this.props.image && this.props.image.image) {
      return this.props.image.image
    } else {
      return null;
    }
  }

  displayTableBody() {
    if (this.props.tableBody && this.props.tableBody.tableBody) {
      return this.props.tableBody.tableBody
    } else {
      return null;
    }
  }

  render() {
  	return (
  		<div>
  			<table align="center">
  				<thead key="thead">
						<tr>
							<th>Title</th>
							<th>IPFS Hash</th>
							<th>Released</th>
							<th>Release Date</th>
						</tr>
  				</thead>
  				<tbody key="tbody">
						{this.displayTableBody()}
  				</tbody>
  			</table>

  			<img src={this.displayImage()} />
      </div>
  	)
  }
}

const mapStateToProps = (state) => {
  return { contract: state.contract, accounts: state.accounts, image: state.image, sebid: state.sebid, tableBody: state.tableBody };
};

export default connect(
  mapStateToProps,
  { setSebid, setTableBody }
)(ListEntries);