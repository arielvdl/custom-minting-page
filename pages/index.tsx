import {
  ChainId,
  useClaimedNFTSupply,
  useContractMetadata,
  useNetwork,
  useNFTDrop,
  useUnclaimedNFTSupply,
  useActiveClaimCondition,
  useClaimNFT,
  useWalletConnect,
  useCoinbaseWallet
} from "@thirdweb-dev/react";
import { useNetworkMismatch } from "@thirdweb-dev/react";
import { useAddress, useMetamask } from "@thirdweb-dev/react";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import Modal from "react-modal";
import type { NextPage } from "next";
import Image from 'next/image'
import Router from "next/router";
import { useState } from "react";
import styles from "../styles/Theme.module.css";

// Modal.setAppElement('#modal');
// Put Your NFT Drop Contract address from the dashboard here
const myNftDropContractAddress = "0x04ef60e53f4d6E4A7e3A047D92ad5BE0cB4B2111";
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    color: "black"
  }
};

const Home: NextPage = () => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const nftDrop = useNFTDrop(myNftDropContractAddress);
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const connectWithWalletConnect = useWalletConnect();
  const connectWithCoinbaseWallet = useCoinbaseWallet();
  const isOnWrongNetwork = useNetworkMismatch();
  const claimNFT = useClaimNFT(nftDrop);
  const [, switchNetwork] = useNetwork();
  const [popupMessage, setMessage] = useState("");
  const [popupTitle, setTitle] = useState("");

  // The amount the user claims
  const [quantity, setQuantity] = useState(1); // default to 1

  // Load contract metadata
  const { data: contractMetadata } = useContractMetadata(
    myNftDropContractAddress
  );

  // Load claimed supply and unclaimed supply
  const { data: unclaimedSupply } = useUnclaimedNFTSupply(nftDrop);
  const { data: claimedSupply } = useClaimedNFTSupply(nftDrop);

  // Load the active claim condition
  const { data: activeClaimCondition } = useActiveClaimCondition(nftDrop);

  // Check if there's NFTs left on the active claim phase
  const isNotReady =
    activeClaimCondition &&
    parseInt(activeClaimCondition?.availableSupply) === 0;

  // Check if there's any NFTs left
  const isSoldOut = unclaimedSupply?.toNumber() === 0;

  // Check price
  const price = parseUnits(
    activeClaimCondition?.currencyMetadata.displayValue || "0",
    activeClaimCondition?.currencyMetadata.decimals
  );

  // Multiply depending on quantity
  const priceToMint = price.mul(quantity);

  // Loading state while we fetch the metadata
  if (!nftDrop || !contractMetadata) {
    return <div className={styles.container}>
      
      <img
            src="/diamante.gif"
            alt="Rough Diamond Logo"
            width={100}
            className={styles.diamante}
          />
          
    </div>;
  }

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  // Function to mint/claim an NFT
  const mint = async () => {
    if (isOnWrongNetwork) {
      switchNetwork && switchNetwork(4);
      return;
    }

    claimNFT.mutate(
      { to: address as string, quantity },
      {
        onSuccess: () => {
          //alert(`Successfully minted NFT${quantity > 1 ? "s" : ""}!`);
          Router.push("/success1");
        },
        onError: (err: any) => {
          if (err?.message.includes("User denied")) {
            setTitle("Ops!");
            setMessage(err?.message);
          } else if (err?.message.includes("execution reverted")) {
            // setTitle("Atention");
            setMessage("Only 1 nft allowed per whitelisted approved wallet.");
          } else {
            setMessage(
              "Something went wrong, please verify that you are on the access list. Try again."
            );
            // setMessage(err?.message);
          }
          openModal();
          console.error(err);
        }
      }
    );
  };

  return (
    <div className={styles.container}>

      <div className={styles.mintInfoContainer}>

      <div className={styles.diamanteHeader}>
          <img
            src="/diamante.gif"
            alt="Rough Diamond Logo"
            width={80}
            className={styles.diamante}
          />
      </div>

        <div className={styles.imageSide}>
          {/* Image Preview of NFTs */}
          <Image
            className={styles.image}
            src={contractMetadata?.image}
            alt={`${contractMetadata?.name} preview image`}
            width={350}
            height={350}
          />
          {/* Amount claimed so far */}
          <div className={styles.mintCompletionArea}>
            <div className={styles.mintAreaLeft}>
              <p>Total</p>
            </div>
            <div className={styles.mintAreaRight}>
              {claimedSupply && unclaimedSupply ? (
                <p>
                  {/* Claimed supply so far */}
                  <b>{claimedSupply?.toNumber()}</b>
                  {" / "}
                  {
                    // Add unclaimed and claimed supply to get the total supply
                    claimedSupply?.toNumber() + unclaimedSupply?.toNumber()
                  }
                </p>
              ) : (
                // Show loading state if we're still loading the supply
                <p>Loading...</p>
              )}
            </div>
          </div>

          {/* Show claim button or connect wallet button */}
          {address ? (
            // Sold out or show the claim button
            isSoldOut ? (
              <div>
                <h2 className={styles.soldout}>Sold Out</h2>
              </div>
            ) : isNotReady ? (
              <div>
                <h2>Wait...</h2>
              </div>
            ) : (
              <>
                <p>Quantity</p>
                <div className={styles.quantityContainer}>
                  <button
                    className={`${styles.quantityControlButton}`}
                    onClick={() => setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>

                  <h4>{quantity}</h4>

                  <button
                    className={`${styles.quantityControlButton}`}
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={
                      quantity >=
                      parseInt(
                        activeClaimCondition?.quantityLimitPerTransaction || "0"
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className={`${styles.mainButton} ${styles.spacerTop} ${styles.spacerBottom}`}
                  onClick={mint}
                  disabled={claimNFT.isLoading}
                >
                  {claimNFT.isLoading
                    ? "Minting..."
                    : `Mint${quantity > 1 ? ` ${quantity}` : ""}${
                        activeClaimCondition?.price.eq(0)
                          ? " (Free)"
                          : activeClaimCondition?.currencyMetadata.displayValue
                          ? ` (${formatUnits(
                              priceToMint,
                              activeClaimCondition.currencyMetadata.decimals
                            )} ${
                              activeClaimCondition?.currencyMetadata.symbol
                            })`
                          : ""
                      }`}
                </button>
              </>
            )
          ) : (
            <div className={styles.buttons}>
              <button
                className= {styles.metamaskbt}
                onClick={connectWithMetamask}
              >
                Connect MetaMask
              </button>
              <button
                className={styles.mainButton}
                onClick={connectWithWalletConnect}
              >
                Connect with Wallet Connect
              </button>
            </div>
          )}
        </div>

      </div>


      <div>
       <p className={styles.detail}>Tokenomics (1000 Jerseys Pass): 50 Diamond Jersey > 50 Rarible Gold > more soon. <br> </br>For the most optimal experience, use desktop. This free mint is exclusive to those who joined the Jersey airdrop list.</p> 
      </div>

      <Modal
        ariaHideApp={false}
        isOpen={modalIsOpen}
        style={{
          overlay: {
            backgroundColor: "#ffffff00",
            top: "50%",
            left: "50%",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "50vw",
            minWidth: "390px",
            borderRadius: "30px",
            textAlign: "center"
          },
          content: {
            color: "black",
            backgroundColor: "#ffffff00",
            border: "0px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignContent: "center"
          }
        }}
        contentLabel="resposta"
      >
        <div className={styles.modalContent}>
          <h2>{popupTitle}</h2>
          <h3 className={styles.modalContentH3}>{popupMessage}</h3>
          <div>&nbsp;</div>
          <button onClick={closeModal} className={styles.mainButtonModal}>
            close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
