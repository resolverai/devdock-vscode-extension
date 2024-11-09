import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { List } from 'apache-arrow';
import React, { useEffect, useState } from 'react';
import DevCashSVG from './home/svgs/dev_cash';
import BountiesLeftIcon from './home/svgs/bounties_left_icon';

import GitHubLoginPopup from './login/github_login_popup';
import UserGitHubLoggedInPopup from './user/github_user_loggedin_popup';
import { setCardDataById } from '../extension/store';
import apiService from '../services/apiService';
import { API_END_POINTS } from '../services/apiEndPoints';
import { EVENT_NAME } from '../common/constants';
import { ClientMessage } from '../common/types';
import BountyPopup from './bounty_popup';
import DevdockBountyPopup from './devdock_bounty_popup';


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

interface MyBounty {
  card?: CardItem;
  platform?: string;
  smart_contract_address?: string;
  created_by?: string;
  expiry?: string;

}

const myCardData: CardItem[] = [
  {
    id: 1,
    title: 'Loading ...',
    bulletsArray: ["Loading ...",],
    bottomDescription: 'Loading ...',
    bottomHeading: 'Loading ...',
    description: 'Loading ...',
    bountyPrice: 'Loading ...',
    bountiesLeft: 'Loading ...'
  },

];
interface CardProps {
  isUserLoggedIn?: boolean;
  onBountiesClickedFromList?: (id: number) => void;
}

const global = globalThis as any
const ExpandableCardList: React.FC<CardProps> = ({ isUserLoggedIn, onBountiesClickedFromList }) => {
  console.log('ExpandableCardList isUserLoggedIn', isUserLoggedIn);
  const [expandedCardId, setExpandedCardId] = useState<number | null>();
  const [claimBountyclicked, setClaimBountyClicked] = useState<boolean>(false);
  const [isGitHubPopupVisible, setGitHubPopupVisible] = useState(false);
  const [isLoggedInPopupVisible, setLoggedInUserPopupVisible] = useState(false);
  const [cardData, setIsDataLoadedAndParsed] = useState<CardItem[]>(myCardData);

  const toggleCard = (id: number) => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDevdockBountyPopupOpen, setIsDevdockBountyPopupOpen] = useState(true);//make it false, true is for testing purpose

  const [bountyPopupId, setBountyPoupID] = useState('');

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const handleOpenDevDockPopup = () => setIsDevdockBountyPopupOpen(true);

  const handleSubmit = (id: string, text: string) => {
    console.log('Submit action performed', id, text);

    const storedMyBounties = localStorage.getItem('myBounties');
    setIsPopupOpen(false); // Close popup after submission
    if (storedMyBounties) {
      const myBountiesArray = JSON.parse(storedMyBounties);
      const myBounty = myBountiesArray.find((myBounty: MyBounty) => myBounty?.card?.id === parseInt(id));
      if (myBounty) {
        console.log('MyBounty found:', myBounty);
        handleBountySubmit(parseInt(id), text, myBounty.platform);
      }
    }


  };


  const initiateBountyCreationFlow = (content: string) => {
    setIsDevdockBountyPopupOpen(false);
    console.log('bounty creation flow', content);
    //call backend to create a bounty for the content

    const myData = { description: content }
    global.vscode.postMessage({
      type: EVENT_NAME.devdockBountyCreationRequest,
      data: JSON.stringify(myData),
    }) as ClientMessage;

  }



  function handleClaimBountyClick(id: number): void {

    if (!isUserLoggedIn) {
      setGitHubPopupVisible(true);
      return;
    }

    const isBountyClicked = localStorage.getItem(`bounty_${id}`) === 'true';


    // const storedMyBounties = localStorage.getItem('myBounties');
    // if (storedMyBounties) {
    //   const myBountiesArray = JSON.parse(storedMyBounties);
    //   const myBounty = myBountiesArray.find((myBounty: MyBounty) => myBounty?.card?.id === id);
    //   if (myBounty) {
    //     console.log('MyBounty found:', myBounty);
    //     if (myBounty.platform == 'Devcash') {
    //       //this is a devcash bounty
    //       handleOpenPopup();
    //     } else if (myBounty.platform == 'Devdock') {
    //       //this is a devdock bounty
    //       handleOpenDevDockPopup();
    //     }
    //     else {
    //       console.log('Something wrong with the platform of bounty');
    //     }
    //   } else {
    //     console.log('MyBounty not found');
    //   }
    // } else {
    //   console.log('No myBounties stored in local storage');
    // }

    if (isBountyClicked) {
      //this is submit bounty flow
      console.log("this is submit bounty flow for id:", id);
      setBountyPoupID(`${id}`);
      handleOpenPopup();

    } else {
      localStorage.setItem(`bounty_${id}`, 'true');
      console.log("clicked bounty id:" + id);

      setClaimBountyClicked(true);
      const selectedCard = cardData!.find(card => card.id === id);

      if (selectedCard) {
        setCardDataById(selectedCard); // Save only the selected card data in the global store
      }

      // onBountiesClickedFromList ? onBountiesClickedFromList(id) : null;

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



  }


  async function fetchAllBounties() {
    console.log('called fetchAllBounties');
    const response = await apiService.get(API_END_POINTS.FETCH_BOUNTIES);
    console.log(JSON.stringify(response));
    const [cardItems, myBounties] = mapApiResponseToCardData(response);
    const CardItem = cardItems;
    localStorage.setItem('myBounties', JSON.stringify(myBounties));

    console.log('CardItem[0]', CardItem[0]);
    console.log('MyBounty[0]', myBounties[0]);

    if (CardItem.length > 0)
      setIsDataLoadedAndParsed(CardItem);

  }
  useEffect(() => {
    console.log('call fetchAllBounties');
    fetchAllBounties();
  }, [])
  useEffect(() => {
    setExpandedCardId(cardData[0].id);
  }, [cardData])

  function mapApiResponseToCardData(apiResponse: any): [CardItem[], MyBounty[]] {

    const cardItems: CardItem[] = [];
    const myBounties: MyBounty[] = [];

    apiResponse.data.forEach(
      (item: any) => {
        const myBounty: MyBounty = {};

        const cardItem: CardItem = {
          id: item.id, // Assuming `item.id` is unique for each bounty
          title: `[${item.platform.toUpperCase()} BOUNTY] ${item.title}`,
          bulletsArray: item.bulletsArray ? item.bulletsArray : [item.platform, item.category, item.scope_result],
          bottomDescription: item.num_submissions_left > 0 ? 'You can make multiple submissions' : 'No more submissions allowed',
          bottomHeading: item.num_submissions_left > 0 ? `${item.num_submissions_left} Submissions left` : 'Submissions closed',
          description: `<b>Mission</b></br>${item.description}</br><b>Bounty amount:</b> ${item.amount || 'Not specified'}</br><b>Bounty Description:</b> ${item.description}</br><b>public/private bounty:</b> ${item.scope_result}</br><b>bounty smart contract address:</b> ${item.smart_contract_address}</br><b>Created By:</b> ${item.created_by}</br><b>Bounties left:</b> ${item.num_submissions_left} and <b>deadline:</b> ${new Date(item.updated_at).toLocaleDateString()}\n`,
          bountyPrice: `${item.amount || '0'} ${item.token || 'Devcash'}`,
          bountiesLeft: `${item.num_submissions_left || '0'} Bounties left`
        };

        myBounty.card = cardItem;
        myBounty.platform = item.platform;
        myBounty.smart_contract_address = item.smart_contract_address;
        myBounty.created_by = item.created_by;
        myBounty.expiry = item.expiry;

        cardItems.push(cardItem);
        myBounties.push(myBounty);
      });

    return [cardItems, myBounties];
  }


  // Function to close the popup
  const closePopup = () => {
    setGitHubPopupVisible(false);
  };

  // Function to close the popup
  const closeLoggedinPopup = () => {
    setLoggedInUserPopupVisible(false);
  };



  function handleBountySubmit(bountyId: number, message: string, platform: string) {

    if (isUserLoggedIn) {
      console.log(`Submit clicked for bountyId ${bountyId}`);

      // const myBountyMessage = {
      //   bounty_id: bountyId,
      // }
      // const postMessageVal = JSON.stringify(myBountyMessage);
      // console.log('postMessageVal', postMessageVal);
      const myData = { id: bountyId, description: message, platform: platform }
      global.vscode.postMessage({
        type: EVENT_NAME.devdockBountySubmitRequest,
        data: JSON.stringify(myData),
      }) as ClientMessage;

    }


  }

  return (
    <div style={styles.parentCard}>
      {cardData!.map(card => {
        const isBountyClicked = localStorage.getItem(`bounty_${card.id}`) === 'true';

        return (
          (card.bountyPrice && parseInt(card.bountyPrice) > 0 && <div key={card.id} style={styles.card}>
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

                {/* <span style={{ color: '#ffffff', lineHeight: '15px', 
                fontWeight: 'lighter', fontSize: '10px', alignContent: 'center', 
                fontStyle: 'normal', }}>
                {card.description}</span> */}

                <div style={{
                  color: '#ffffff', lineHeight: '15px',
                  fontWeight: 'lighter', fontSize: '10px', alignContent: 'center',
                  fontStyle: 'normal',
                }} dangerouslySetInnerHTML={{
                  __html:

                    card.description

                }} />


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
                    {isBountyClicked ? 'Submit bounty' : `Attempt bounty for ${card.bountyPrice}`}

                  </span>


                </div>

              </div>

            )}
          </div>)

        )
      }
      )}
      {isGitHubPopupVisible && <GitHubLoginPopup onClose={closePopup}></GitHubLoginPopup>}
      {isLoggedInPopupVisible && <UserGitHubLoggedInPopup onClose={closeLoggedinPopup}></UserGitHubLoggedInPopup>}
      <BountyPopup isOpen={isPopupOpen} handleCloseClick={handleClosePopup} handleSubmit={handleSubmit} bountyId={bountyPopupId} />
      {<DevdockBountyPopup isDevdockBountyPopupOpen={isDevdockBountyPopupOpen} handleCloseClick={() => {
        setIsDevdockBountyPopupOpen(false);
      }} handleSubmit={(content) => {
        // setIsDevdockBountyPopupOpen(false); // Close popup after submission
        initiateBountyCreationFlow(content);
      }} />}


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
