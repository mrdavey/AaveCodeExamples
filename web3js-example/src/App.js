import React, { useEffect, useState } from 'react';
import Web3 from "web3"
import logo from "./logo.svg"

import './App.css';

// ABI imports
import ERC20ABI from './ABIs/ERC20.json'
import LendingPoolAddressProviderABI from './ABIs/AddressProvider.json'
import LendingPoolABI from './ABIs/LendingPool.json'

function App() {
  const [web3, setWeb3] = useState(null)
  const [myAddress, setMyAddress] = useState(null)

  useEffect(() => {
    async function getAccount() {
      const getWeb3 = new Web3(window.ethereum)
      window.ethereum.enable()
      window.web3 = getWeb3

      setWeb3(getWeb3)
      const address = (await getWeb3.eth.getAccounts())[0]
      console.log("Wallet address: ", address)
      setMyAddress(address)
    }

    getAccount()
  }, [])

  // Create the LendingPoolAddressProvider contract instance
  function getLendingPoolAddressProviderContract() {
		const lpAddressProviderAddress = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8" // mainnet address, for other addresses: https://docs.aave.com/developers/developing-on-aave/deployed-contract-instances
		const lpAddressProviderContract = new web3.eth.Contract(LendingPoolAddressProviderABI, lpAddressProviderAddress)
		return lpAddressProviderContract
  }

  // Get the latest LendingPoolCore address
  async function getLendingPoolCoreAddress() {
    const lpCoreAddress = await getLendingPoolAddressProviderContract()
      .methods.getLendingPoolCore()
      .call()
      .catch((e) => {
        throw Error(`Error getting lendingPool address: ${e.message}`)
      })

    console.log("LendingPoolCore address: ", lpCoreAddress)
    return lpCoreAddress
  }

  // Get the latest LendingPool address
  async function getLendingPoolAddress() {
    const lpAddress = await getLendingPoolAddressProviderContract().methods
      .getLendingPool()
      .call()
      .catch((e) => {
        throw Error(`Error getting lendingPool address: ${e.message}`)
      })
    console.log("LendingPool address: ", lpAddress)
    return lpAddress
  }

  /**
   * Deposit DAI into Aave to receive the equivalent aDAI
   * Note: User must have DAI already in their wallet!
   */
  async function deposit() {
    const daiAmountinWei = web3.utils.toWei("1000", "ether").toString()
    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" // mainnet DAI
    const referralCode = "0"

    try {
      const lpCoreAddress = await getLendingPoolCoreAddress()

      // Approve the LendingPoolCore address with the DAI contract
      const daiContract = new web3.eth.Contract(ERC20ABI, daiAddress)
      await daiContract.methods
        .approve(lpCoreAddress, daiAmountinWei)
        .send({ from: myAddress })
        .catch((e) => {
          throw Error(`Error approving DAI allowance: ${e.message}`)
        })

      // Make the deposit transaction via LendingPool contract
      const lpAddress = await getLendingPoolAddress()
      const lpContract = new web3.eth.Contract(LendingPoolABI, lpAddress)
      await lpContract.methods
        .deposit(daiAddress, daiAmountinWei, referralCode)
        .send({ from: myAddress })
        .catch((e) => {
          throw Error(`Error depositing to the LendingPool contract: ${e.message}`)
        })
    } catch (e) {
      alert(e.message)
      console.log(e.message)
    }
  }

  /**
   * Borrow DAI from Aave
   * Note: User must have already deposited some collateral to borrow
   */
  async function borrow() {
		const daiAmountinWei = web3.utils.toWei("1000", "ether").toString()
		const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" // mainnet DAI
		const interestRateMode = 2 // variable rate
		const referralCode = "0"

		try {
			// Make the borrow transaction via LendingPool contract
			const lpAddress = await getLendingPoolAddress()
			const lpContract = new web3.eth.Contract(LendingPoolABI, lpAddress)
			await lpContract.methods
				.borrow(daiAddress, daiAmountinWei, interestRateMode, referralCode)
				.send({ from: myAddress })
				.catch((e) => {
					throw Error(`Error borrowing from the LendingPool contract: ${e.message}`)
				})
		} catch (e) {
			alert(e.message)
			console.log(e.message)
		}
  }

  /**
   * Repay an outstanding borrow with DAI
   * Note: User must have borrowed DAI
   */
  async function Repay() {
		const daiAmountinWei = web3.utils.toWei("1000", "ether").toString()
		const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" // mainnet DAI

		try {
			// Repay via LendingPool contract
			const lpAddress = await getLendingPoolAddress()
			const lpContract = new web3.eth.Contract(LendingPoolABI, lpAddress)
			await lpContract.methods
				.repay(daiAddress, daiAmountinWei, myAddress)
				.send({ from: myAddress })
				.catch((e) => {
					throw Error(`Error repaying in the LendingPool contract: ${e.message}`)
				})
		} catch (e) {
			alert(e.message)
			console.log(e.message)
		}
  }

  return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<p>
					See our{" "}
					<a className="App-link" href="https://docs.aave.com/developers" target="_blank">
						official developer docs
					</a>{" "}
					for more
        </p><p>
					Web3 connected successfully with address:
					<br />
					{myAddress}
				</p>
				<p>
					<button className="App-button" onClick={async () => await deposit()}>
						Deposit
					</button>
					<button className="App-button" onClick={async () => await borrow()}>
						Borrow
					</button>
				</p>
			</header>
		</div>
  )
}

export default App;
