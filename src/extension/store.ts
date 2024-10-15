let globalVariable: any = null;

export const setGlobalVariable = (value: any) => {
  globalVariable = value;
};

export const getGlobalVariable = () => {
  return globalVariable;
};

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

let selectedCard: CardItem | null = null;

export const setCardDataById = (data: CardItem) => {
  selectedCard = data;
};

export const getCardData = () => {
  return selectedCard;
};
