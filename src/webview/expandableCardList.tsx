import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { List } from 'apache-arrow';
import React, { useEffect, useState } from 'react';
import DevCashSVG from './home/svgs/dev_cash';
import BountiesLeftIcon from './home/svgs/bounties_left_icon';

import GitHubLoginPopup from './login/github_login_popup';
import UserGitHubLoggedInPopup from './user/github_user_loggedin_popup';
import { setCardDataById } from '../extension/store';
import apiService from '../services/apiService';


interface CardItem {
  id: number;
  title: string;
  description: string;
  bulletsArray: string[];
  bottomHeading: string;
  bottomDescription: string;
  bountyPrice: string;
  bountiesLeft: string;
}

const myCardData: CardItem[] = [
  {
    id: 1,
    title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description: 'Mission\nWrite a Javascript program to scrape each bounty (e.g. https://devcash.dev/bountyplatform/bounty/192)\nShould get\n\nBounty amount\nBounty Description\npublic/private bounty\nbounty smart contract addresss\nCreated By\nBounties left and deadline\n\nThen we need an API to serve all this info.\n',
    bountyPrice: '1000 Devcash',
    bountiesLeft: '8 Bounties left'
  },
  {
    id: 2,
    title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description:
      "1. Install Metamask and set up your wallet (metamask.io)\n" +
      "2. Connect your Metamask to Gnosis Chain using chainlist.org \n" +
      "3. Receive a small amount of xDAI. You can either join the Dev Discord and request a small amount, or purchase it yourself \n" +
      "4. Make a submission on this bounty. Add a constructive or humorous comment \n" +
      "5. Wait for review and acceptance \n" +
      "6. Check your Devcash Balance \n",
    bountyPrice: '900 Devcash',
    bountiesLeft: '3 Bounties left'
  },
  {
    id: 3,
    title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description: 'Mission\nWrite a Javascript program to scrape each bounty (e.g. https://devcash.dev/bountyplatform/bounty/192)\nShould get\n\nBounty amount\nBounty Description\npublic/private bounty\nbounty smart contract addresss\nCreated By\nBounties left and deadline\n\nThen we need an API to serve all this info.\n',
    bountyPrice: '800 Devcash',
    bountiesLeft: '2 Bounties left'
  },


];
interface CardProps {
  isUserLoggedIn?: boolean;
  onBountiesClickedFromList?: (id: number) => void;
}
const global = globalThis as any
const ExpandableCardList: React.FC<CardProps> = ({ isUserLoggedIn, onBountiesClickedFromList }) => {
  console.log('ExpandableCardList isUserLoggedIn', isUserLoggedIn);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(1);
  const [claimBountyclicked, setClaimBountyClicked] = useState<boolean>(false);
  const [isGitHubPopupVisible, setGitHubPopupVisible] = useState(false);
  const [isLoggedInPopupVisible, setLoggedInUserPopupVisible] = useState(false);
  const [cardData, setIsDataLoadedAndParsed] = useState<CardItem[]>(myCardData);

  const toggleCard = (id: number) => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };

  function handleClaimBountyClick(id: number): void {
    console.log("clicked bounty id:" + id);
    setClaimBountyClicked(true);
    const selectedCard = cardData!.find(card => card.id === id);

    if (selectedCard) {
      setCardDataById(selectedCard); // Save only the selected card data in the global store
    }


    if (!isUserLoggedIn) {
      setGitHubPopupVisible(true);
      console.log("user not loggedin and claim button clicked");
    }
    else {
      //start bounty process
      // setLoggedInUserPopupVisible(true);
      console.log("user loggedin and claim button clicked");
      onBountiesClickedFromList ? onBountiesClickedFromList(id) : null;

    }

  }


  async function fetchAllBounties() {
    console.log('called fetchAllBounties');
    const response = await apiService.getWithFullUrl('https://dapp.devdock.ai/v1/master/bounties');
    console.log(JSON.stringify(response));
    const CardItem = mapApiResponseToCardData(response);
    console.log('CardItem[0]', CardItem[0]);
    //convert response to CardItems so that carditem can be shown as expandable cards
    //once data parsing is done set state of data so that re-rendering can happen
    //while re-rendering use this updated data object to show data on the list
    if (CardItem.length > 0)
      setIsDataLoadedAndParsed(CardItem);

  }
  useEffect(() => {
    console.log('call fetchAllBounties');
    fetchAllBounties();
  }, [])
  useEffect(() => {

  }, [cardData])

  function mapApiResponseToCardData(apiResponse: any): CardItem[] {
    return apiResponse.data.map((item: any) => {
      return {
        id: item.id, // Assuming `item.id` is unique for each bounty
        title: `[${item.platform.toUpperCase()} BOUNTY] ${item.title}`,
        bulletsArray: item.bulletsArray ? item.bulletsArray : [item.platform, item.category, item.scope_result],
        bottomDescription: item.num_submissions_left > 0 ? 'You can make multiple submissions' : 'No more submissions allowed',
        bottomHeading: item.num_submissions_left > 0 ? `${item.num_submissions_left} Submissions left` : 'Submissions closed',
        description: `Mission\n${item.description}\n\nBounty amount: ${item.amount || 'Not specified'}\nBounty Description: ${item.description}\npublic/private bounty: ${item.scope_result}\nbounty smart contract address: ${item.smart_contract_address}\nCreated By: ${item.created_by}\nBounties left: ${item.num_submissions_left} and deadline: ${new Date(item.updated_at).toLocaleDateString()}\n`,
        bountyPrice: `${item.amount || '0'} ${item.token || 'Devcash'}`,
        bountiesLeft: `${item.num_submissions_left || '0'} Bounties left`
      };
    });
  }


  // Function to close the popup
  const closePopup = () => {
    setGitHubPopupVisible(false);
  };

  // Function to close the popup
  const closeLoggedinPopup = () => {
    setLoggedInUserPopupVisible(false);
  };



  return (
    <div style={styles.parentCard}>
      {cardData!.map(card => (
        <div key={card.id} style={styles.card}>
          <div style={styles.cardHeader} onClick={() => toggleCard(card.id)}>

            <span style={
              {
                color: '#ffffff',
                fontSize: '12px', alignContent: 'center',
                fontStyle: 'normal', fontWeight: 'normal'
              }}>
              {card.title}
            </span>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: '258px' }}>
              <div style={
                {
                  display: 'flex',
                  flexDirection: 'row',
                  backgroundColor: '#7A71F3',
                  borderRadius: '24px',
                  width: '110px',
                  padding: '4px',
                  marginBottom: '10px',
                  marginTop: '10px',
                  alignContent: 'center',
                  justifyContent: 'center'
                }
              }>
                <DevCashSVG></DevCashSVG>
                <div style={{ width: '10px', }}></div>
                <span style={{ color: '#ffffff', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', fontWeight: 'normal' }}>{card.bountyPrice}</span>

              </div>
              <div style={{ width: '30px' }}></div>
              <div style={
                {
                  display: 'flex',
                  flexDirection: 'row',
                  backgroundColor: '#252527',
                  borderRadius: '24px',
                  width: '110px',
                  padding: '4px',
                  marginBottom: '10px',
                  marginTop: '10px',
                  alignContent: 'center',
                  justifyContent: 'center'
                }
              }>
                <BountiesLeftIcon></BountiesLeftIcon>
                <div style={{ width: '10px' }}></div>
                <span style={{ opacity: '0.8', color: '#ffffff', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', fontWeight: '400' }}>{card.bountiesLeft}</span>

              </div>

            </div>

          </div>
          <div style={{ height: 1, width: '100%', backgroundColor: "#37373C" }}></div>

          {expandedCardId === card.id && (
            <div style={styles.cardBody}>
              {card.bulletsArray.map((bullet, index) => (

                <li key={index}>

                  <span style={{ color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', }}>
                    {bullet}
                  </span>
                </li> // Display each bullet as a list item
              ))}
              <div style={{ height: '20px', }} />

              <span style={{ color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', }}>
                {card.description}</span>


              <div style={{ height: '10px', fontWeight: 'normal' }} />
              <span style={{ color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', }}>
                {card.bottomHeading}
              </span>

              <div style={{ height: '10px', fontWeight: 'normal' }} />

              <span style={{ color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', }}>
                {card.bottomDescription}
              </span>
              <div style={{ height: '10px' }} />
              <div
                onClick={() => {
                  handleClaimBountyClick(card.id);
                }}
                style={{

                  width: '258px',
                  height: '25px',
                  borderRadius: '30px',
                  padding: "8px 16px",
                  // background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)', // Gradient background
                  background: "white",
                  color: 'white', // Optional: Set text color if needed for contrast
                  display: 'flex', // To center the text
                  flexDirection: 'column',
                  alignItems: 'center', // Vertically center the text
                  justifyContent: 'center', // Horizontally center the text
                  cursor: 'pointer',

                }}>
                {/* <span style={{ color: '#ffffff', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', fontWeight: 'normal' }}>Submit Entry</span> */}


                <span
                  style={{
                    color: '#000000',
                    fontSize: '12px',
                    alignContent: 'center',
                    fontStyle: 'normal',
                    fontWeight: 'normal',
                    opacity: '0.8',
                    cursor: 'pointer',
                  }}>
                  Claim {card.bountyPrice}
                </span>


              </div>

            </div>

          )}
        </div>
      ))}
      {isGitHubPopupVisible && <GitHubLoginPopup onClose={closePopup}></GitHubLoginPopup>}
      {isLoggedInPopupVisible && <UserGitHubLoggedInPopup onClose={closeLoggedinPopup}></UserGitHubLoggedInPopup>}


    </div >
  );
};




const styles = {
  parentCard: {
    height: 'auto'

  },
  card: {
    border: '1px solid #37373C',
    borderRadius: '8px',
    margin: '10px',
    padding: '10px',
    backgroundColor: '#292929',
  },
  cardHeader: {
    cursor: 'pointer',
    fontWeight: 'normal',
    fontSize: '12px',
    color: 'white'

  },
  cardBody: {
    marginTop: '10px',
    fontSize: '10px',
    height: '310',


  },
};

export default ExpandableCardList;
