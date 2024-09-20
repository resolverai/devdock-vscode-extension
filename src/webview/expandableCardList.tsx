import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { List } from 'apache-arrow';
import React, { useState } from 'react';

interface CardItem {
  id: number;
  title: string;
  description: string;
  bulletsArray: string[];
  bottomHeading: string;
  bottomDescription: string;
}

const cardData: CardItem[] = [
  { id: 1, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas', bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",], bottomDescription: 'You can make multiple submissions', bottomHeading: 'Top 10 Submissions will be approved', description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.' },
  { id: 2, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas', bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",], bottomDescription: 'You can make multiple submissions', bottomHeading: 'Top 10 Submissions will be approved', description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.' },
  { id: 3, title: '[BEAST BOUNTY] Bitcoin Entertainment Ideas', bulletsArray: ["Bitcoin Entertainment", "Bitcoin Education", "Bitcoin Philanthropy",], bottomDescription: 'You can make multiple submissions', bottomHeading: 'Top 10 Submissions will be approved', description: 'Mr Bitcoin Beast wants to entertain Bitcoin followers What are the most entertaining things about Bitcoin? How can we make Bitcoin even more entertaining? Provide either an amazing idea, or an idea with lots of details, if you want your submission to get approved.' },
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
            {card.title}
          </div>
          <div style={{ height: 1, width: '100%', backgroundColor: "#212121" }}></div>
          {expandedCardId === card.id && (
            <div style={styles.cardBody}>
              {card.bulletsArray.map((bullet, index) => (
                <li key={index}>{bullet}</li> // Display each bullet as a list item
              ))}
              <div style={{ height: '20px' }} />
              {card.description}
              <div style={{ height: '10px' }} />
              {card.bottomHeading}
              <div style={{ height: '10px' }} />
              {card.bottomDescription}
              <div style={{ height: '10px' }} />
              <div style={{
                width: '80%',
                height: '25px',
                borderRadius: '30px',
                padding: "8px 16px",
                background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)', // Gradient background
                color: 'white', // Optional: Set text color if needed for contrast
                display: 'flex', // To center the text
                alignItems: 'center', // Vertically center the text
                justifyContent: 'center', // Horizontally center the text
                cursor: 'pointer',

              }}>
                Claim Bounty
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
    height: '90vh'
  },
  card: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    margin: '10px',
    padding: '10px',

  },
  cardHeader: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  cardBody: {
    marginTop: '10px',
    fontSize: '10px',

  },
};

export default ExpandableCardList;
