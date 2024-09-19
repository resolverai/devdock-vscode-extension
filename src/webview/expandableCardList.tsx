import React, { useState } from 'react';

interface CardItem {
  id: number;
  title: string;
  description: string;
}

const cardData: CardItem[] = [
  { id: 1, title: 'Card 1', description: 'This is the detailed description for Card 1' },
  { id: 2, title: 'Card 2', description: 'This is the detailed description for Card 2' },
  { id: 3, title: 'Card 3', description: 'This is the detailed description for Card 3' },
];

const ExpandableCardList: React.FC = () => {
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const toggleCard = (id: number) => {
    setExpandedCardId(prevId => (prevId === id ? null : id));
  };

  return (
    <div>
      {cardData.map(card => (
        <div key={card.id} style={styles.card}>
          <div style={styles.cardHeader} onClick={() => toggleCard(card.id)}>
            {card.title}
          </div>
          {expandedCardId === card.id && (
            <div style={styles.cardBody}>
              {card.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    margin: '10px 0',
    padding: '10px',
  },
  cardHeader: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  cardBody: {
    marginTop: '10px',
    fontSize: '14px',
  },
};

export default ExpandableCardList;
