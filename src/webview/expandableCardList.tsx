import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { List } from 'apache-arrow';
import React, { useState } from 'react';
import DevCashSVG from './home/svgs/dev_cash';
import BountiesLeftIcon from './home/svgs/bounties_left_icon';

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

const cardData: CardItem[] = [
  {
    id: 1, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.',
    bountyPrice: '1000 Devcash',
    bountiesLeft: '8 Bounties left'
  },
  {
    id: 2, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.',
    bountyPrice: '900 Devcash',
    bountiesLeft: '3 Bounties left'
  },
  {
    id: 3, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas',
    bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",],
    bottomDescription: 'You can make multiple submissions',
    bottomHeading: 'Top 10 Submissions will be approved',
    description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.',
    bountyPrice: '800 Devcash',
    bountiesLeft: '2 Bounties left'
  },


];

const ExpandableCardList: React.FC = () => {
  const [expandedCardId, setExpandedCardId] = useState<number | null>(1);

  const toggleCard = (id: number) => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };

  return (
    <div style={styles.parentCard}>
      {cardData.map(card => (
        <div key={card.id} style={styles.card}>
          <div style={styles.cardHeader} onClick={() => toggleCard(card.id)}>

            <span style={{ color: '#ffffff', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', fontWeight: 'normal' }}>{card.title}</span>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
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
              <div style={{
                width: '80%',
                height: '25px',
                borderRadius: '30px',
                padding: "8px 16px",
                // background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)', // Gradient background
                background: "white",
                color: 'white', // Optional: Set text color if needed for contrast
                display: 'flex', // To center the text
                alignItems: 'center', // Vertically center the text
                justifyContent: 'center', // Horizontally center the text
                cursor: 'pointer',

              }}>
                {/* <span style={{ color: '#ffffff', fontSize: '10px', alignContent: 'center', fontStyle: 'normal', fontWeight: 'normal' }}>Submit Entry</span> */}


                <span style={{ color: '#000000', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', fontWeight: 'normal', opacity: '0.8' }}>Claim {card.bountyPrice}</span>


              </div>
            </div>

          )}
        </div>
      ))}
    </div>
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
