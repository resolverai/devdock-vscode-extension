import {tokenAddres, tokenABI } from '../common/tokenABI';
import {rewardAddres, rewardABI } from "../common/rewardContract";

import {http,createWalletClient,createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
const account = privateKeyToAccount(`0x${process.env.CONTRACT_DEPLOYER_PRIVATE_KEY || ''}`)
const walletClient = createWalletClient({ 
    account,
  chain: sepolia, 
  transport: http(), 
})
const publicClient = createPublicClient({
chain:sepolia,
transport: http()
})
// function to update claimable balance of the user
const assignReward=async(userAddress:string,score:number)=>{
    const { request } = await publicClient.simulateContract({
        address: rewardAddres,
        abi: rewardABI,
        functionName: 'updateBalance',
        args: [userAddress,score],
        account
      })
      await walletClient.writeContract(request)

}
// function to get the claimable balance of the user

const getClaimableBalance=async(userAddress:string)=>{
    const data = await publicClient.readContract({
        address: rewardAddres,
        abi: rewardABI,
        functionName: 'getBalance',
        args: [userAddress]
      })
      console.log(Number(data)*10**-18)
}
// function to get the total available pool balance

const getTotalAvailable=async()=>{
  const data =await publicClient.readContract({
    address:rewardAddres,
    abi:rewardABI,
    functionName:"getPoolBalance" })
    console.log(Number(data)*10**-18)
}

// function to claim reward (added for testing purpose only , another logicneeds to be implemented on the webui for claiming part)
const claimReward=async(claimAmount:number)=>{
  const account1 = privateKeyToAccount("0x212d9555aa109843a11e7c2239f30c863b4cd1af4756c1ed1fc270b3df82b127")
  const walletClient1 = createWalletClient({ 
    account:account1,
    chain: sepolia, 
    transport: http(), 
  })

  const { request } = await publicClient.simulateContract({
    address: rewardAddres,
    abi: rewardABI,
    functionName: 'withdraw',
    account:account1,
    args:[claimAmount]
  })
  await walletClient1.writeContract(request)
  
}


// function to approve the tokwns to contract(added for testing purpose only )

const approve =async()=>{
  const {request} = await publicClient.simulateContract({
    account:account,
    address:tokenAddres,
    abi:tokenABI,
    functionName: 'approve',
    args: [rewardAddres, "1000000000000000000000000000000000000000"]
  })
  await walletClient.writeContract(request)

}

// function to get the wallet balance of the token. once called with an address it will repond with the token balance
const getWalletBalance=async(userAddress:string)=>{
    const data = await publicClient.readContract({
        address: tokenAddres,
        abi: tokenABI,
        functionName: 'balanceOf',
        args: [userAddress]
      })
      console.log(Number(data)*10**-18)
}
// approve()
// assignReward("0xa384b3b69E6ACDa003a3093B3CA68938A3055704",1)
// getWalletBalance("0xa384b3b69E6ACDa003a3093B3CA68938A3055704")
// getClaimableBalance("0xa384b3b69E6ACDa003a3093B3CA68938A3055704")
// getTotalAvailable()
// claimReward(Number(10**19))

export {assignReward, getClaimableBalance, getTotalAvailable, claimReward, approve}