import { API_END_POINTS } from "../services/apiEndPoints";
import apiService from "../services/apiService";
import { ExtensionContext } from "vscode";
import * as vscode from "vscode";

export enum PointsEvents {
  PROMPT = "PROMPT",
  TERMINAL = "TERMINAL",
  BOUNTYSUBMIT = "BOUNTYSUBMIT",
  BUGSUBMISSION = "BUGSUBMISSION",
  SIGNUP = "SIGNUP",
  REFERRAL = "REFERRAL",
  REFERRALBOUNTIES = "REFERRALBOUNTIES",
}
export class DevdockPoints {
  private static instance: DevdockPoints;
  private actions: { [action: string]: number } = {};
  private points: number = 0;
  private static myExtensioncontext: ExtensionContext | null = null;

  private constructor(context: ExtensionContext) {
    DevdockPoints.myExtensioncontext = context;
    this.fetchUserActionPointsMapping();
  }

  public static getInstance(context?: ExtensionContext): DevdockPoints {
    if (!DevdockPoints.instance && context != null) {
      DevdockPoints.instance = new DevdockPoints(context);
    }
    return DevdockPoints.instance;
  }

  public getActionsListFromLocal() {
    const actionsList =
      (DevdockPoints.myExtensioncontext?.globalState.get(
        "userActions"
      ) as string[]) || [];
    if (!actionsList) {
      return;
    }
    return actionsList;
  }

  private fetchUserActionPointsMapping() {
    apiService
      .get(API_END_POINTS.FETCH_USER_ACTIONS_POINTS_MAPPING)
      .then((response: any) => {
        console.log("fetchUserActionPointsMapping", response);
        DevdockPoints.myExtensioncontext?.globalState.update(
          "pointsActionMapping",
          response.data
        );
      })
      .catch((error) => {
        console.log("Error fetching user action points mapping", error);
      });
  }

  public allocatePoints(action: string) {
    if (this.actions[action]) {
      this.points += this.actions[action];
      this.storePoints();
    }
  }

  public getTotalPoints(): number {
    return this.points;
  }

  private storePoints() {
    // vscode.window.storage.setItem("devdockPoints", this.points.toString());
    const actionsList = this.getActionsListFromLocal();
    console.log("userActions read", actionsList);
  }

  private hitApiToInformServer(
    pointsAllocated: number,
    actionDone: string,
    userId?: string
  ) {
    let user_id = "";

    if (userId && userId != null) {
      user_id = userId;
    } else {
      const userInfo = JSON.parse(
        DevdockPoints.myExtensioncontext?.globalState.get(
          "userProfileInfo"
        ) as string
      );

      user_id = userInfo?.id;
    }

    console.log("hitApiToInformServer", user_id);

    //post api
    const postData = {
      points: pointsAllocated,
      action: actionDone,
      user_id: user_id,
    };
    apiService
      .post(API_END_POINTS.SUBMIT_POINTS_FOR_ACTIONS, postData)
      .then((response: any) => {
        console.log("API_END_POINTS.SUBMIT_POINTS_FOR_ACTIONS", response);
        const points = response?.data?.points;
        if (points > 0) {
          vscode.window.showInformationMessage(
            `You've Earned ${points} DevDock points for ${actionDone}`,
            {
              modal: true,
            }
          );
        }
      });
  }

  private fetchUserActionsList() {
    apiService.get(API_END_POINTS.FETCH_USER_ACTIONS).then((response: any) => {
      console.log("response FETCH_USER_ACTIONS", response);
      //on success save response in localstorage
      //   const responseVal = JSON.stringify(response.data);
      const actionsArray: string[] = response.data.map((action: any) =>
        action.toString()
      );
      DevdockPoints.myExtensioncontext?.globalState.update(
        "userActions",
        actionsArray
      );
    });
  }

  public pointsEventDoneFor(eventName: string) {
    //fetch user id if not available from localstorage

    const userDetails = DevdockPoints?.myExtensioncontext?.globalState.get(
      "userProfileInfo"
    ) as any;

    const userDetailsObject = JSON.parse(userDetails as string);
    const myUserId = userDetailsObject?.id;
    console.log("myUserId", myUserId);
    if (myUserId && myUserId != null && myUserId != undefined) {
      const pointsAllocated = this.getPointsForEvents(eventName);
      console.log("pointsAllocated", pointsAllocated);
      this.hitApiToInformServer(pointsAllocated, eventName, myUserId);
    } else {
      console.log("userId not found so points not allocated");
    }
  }

  public getPointsForEvents(eventName: string): number {
    const data = DevdockPoints.myExtensioncontext?.globalState.get(
      "pointsActionMapping"
    ) as { action: string; max_points: number }[];

    if (data) {
      const action = data.find((item) => item.action === eventName);
      if (action) {
        const maxPoints = action.max_points;
        console.log("maxPoints for actions", maxPoints, action);
        return maxPoints;
      }
    }
    return 0;
  }

  private saveUserInfo() {
    //TODO: save below data in extensionContext.globalstate userInfo key so that i can be able to fetch each item by its key name
    // "data": {
    //     "id": 10,
    //     "github_id": "eyJhbGciOiJSUzI",
    //     "username": "eyJhbGciOiJkaXI",
    //     "email": "ms.sharma2505@gmail.com",
    //     "rank": 0,
    //     "created_at": "2024-10-24T17:13:58.254Z",
    //     "updated_at": "2024-10-24T17:13:58.254Z",
    //     "wallets": [
    //         {
    //             "id": 6,
    //             "user_id": 10,
    //             "wallet_address": "kjsdghfkjs",
    //             "chain": "ETHEREUM",
    //             "is_deleted": false,
    //             "balance": 0,
    //             "currency": "ETH",
    //             "created_at": "2024-10-24T18:39:46.580Z",
    //             "updated_at": "2024-10-24T18:39:46.581Z"
    //         }
    //     ],
    //     "profilePic": "https://res.cloudinary.com/dp3e7vgzd/image/upload/v1730055504/samples/d1t6a1pgqdmrg3f4sohh.png",
    //     "profileLabel": "Github_id",
    //     "balance_lable": "Devcash balance",
    //     "balance": 375,
    //     "unclaimed_cash_label": "Unclaimed Devcash",
    //     "unclaimed_cash": 4432,
    //     "claim_now_cta_text": "Claim now",
    //     "other_Wallets_label": "Other wallets connected",
    //     "my_contribution_icon_path": null,
    //     "my_contribution_label": "My contributions",
    //     "my_contribution_web_link": null,
    //     "settings_icon_path": null,
    //     "settings_label": "Settings",
    //     "logout_icon_path": null,
    //     "logout_label": "Logout"
    // }
    // I should be able to fetch user_id as below
    //     const userInfo =
    //     DevdockPoints.myExtensioncontext?.globalState.get("userProfileInfo");
    //   const user_id = userInfo?.data?.id;
  }
}
