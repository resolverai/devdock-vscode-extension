let isUserLoggedIn: boolean = false;

export const setIsLoggedIn = (value: boolean) => {
  isUserLoggedIn = value;
};

export const isUserLoggedInAuth0 = () => {
  return isUserLoggedIn;
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

type UserLoginData = {
  profilePic?: string;
  profileLabel?: string;
  topWalletAddress?: string;
  balance_lable?: string;
  balance?: number;
  unclaimed_cash_label?: string;
  unclaimed_cash?: number;
  claim_now_cta_text?: string;
  other_Wallets_label?: string;
  wallets?: string[];
  my_contribution_icon_path?: string;
  my_contribution_label?: string;
  my_contribution_web_link?: string;
  settings_icon_path?: string;
  settings_label?: string;
  logout_icon_path?: string;
  logout_label?: string;
  privateKey?: string;
  github_id?: string;
};

let userData: UserLoginData | null = null;

export const getUserData = () => {
  return userData;
};
export const setUserData = (mUserData: UserLoginData) => {
  userData = mUserData;
};
