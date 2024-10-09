import React, { useState } from 'react'
import { getMagic } from './magic';


const magic = getMagic()
type Provider = 'github' | 'google' | 'facebook' | 'apple';
const MyTestButton: React.FC = () => {
    // const handleSocialLogin = async (provider: Provider) => {
    //     console.log("Inside Hanlde social login")
    //     try {
    //       //@ts-ignore
    //       await magic?.oauth2.loginWithRedirect({
    //         provider,
    //         redirectURI: new URL("/dashboard", window.location.origin).href,
    //       });
    //     } catch (err) {
    //       console.error(err);
    //     }
    //   };
    
    function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
                event.preventDefault();
        // handleSocialLogin("github");
        console.log("we are in test button")
    }


return (
    <div onClick={handleClick}> 
    Hello world
    </div>
)
}

export default MyTestButton;
