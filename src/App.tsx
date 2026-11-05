import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initAppKit, wagmiAdapter } from "./utils/network";
import { useWallet } from "./hooks/useWallet";
import { useBotCard } from "./hooks/useBotCard";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { CreateCard } from "./pages/CreateCard";
import { MyProfile } from "./pages/MyProfile";
import { PublicProfile } from "./pages/PublicProfile";
import { Explore } from "./pages/Explore";
import { About } from "./pages/About";

initAppKit();

const queryClient = new QueryClient();

const BotCardShell: React.FC = () => {
  const wallet = useWallet();
  const botCard = useBotCard(
    wallet.address,
    wallet.isCorrectChain,
    wallet.getEip1193Provider
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar wallet={wallet} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                wallet={wallet}
                contractAddress={botCard.contractAddress}
                isContractVerified={botCard.isContractVerified}
                totalProfiles={botCard.totalProfiles}
                activityEvents={botCard.activityEvents}
                activityAvailable={botCard.activityAvailable}
                activityReason={botCard.activityReason}
                isLoadingActivity={botCard.isLoadingActivity}
                onRefreshActivity={() => botCard.loadActivityEvents()}
              />
            }
          />
          <Route
            path="/create"
            element={
              <CreateCard
                wallet={wallet}
                existingProfile={botCard.myProfile}
                isLoadingProfile={botCard.isLoadingProfile}
                txStatus={botCard.txStatus}
                txHash={botCard.txHash}
                txBlockNumber={botCard.txBlockNumber}
                txError={botCard.txError}
                contractAddress={botCard.contractAddress}
                onCreateProfile={botCard.createProfileOnChain}
                onResetTx={botCard.resetTxState}
              />
            }
          />
          <Route
            path="/my-profile"
            element={
              <MyProfile
                wallet={wallet}
                profile={botCard.myProfile}
                isLoadingProfile={botCard.isLoadingProfile}
                profileError={botCard.profileError}
                txStatus={botCard.txStatus}
                txHash={botCard.txHash}
                txBlockNumber={botCard.txBlockNumber}
                txError={botCard.txError}
                activityEvents={botCard.activityEvents}
                activityAvailable={botCard.activityAvailable}
                activityReason={botCard.activityReason}
                isLoadingActivity={botCard.isLoadingActivity}
                onRefreshProfile={botCard.loadMyProfile}
                onRefreshActivity={botCard.loadActivityEvents}
                onUpdateProfile={botCard.updateProfileOnChain}
                onResetTx={botCard.resetTxState}
              />
            }
          />
          <Route path="/profile/:walletAddress" element={<PublicProfile />} />
          <Route
            path="/explore"
            element={
              <Explore
                recentEvents={botCard.activityEvents}
                connectedWallet={wallet.address}
              />
            }
          />
          <Route
            path="/about"
            element={
              <About
                contractAddress={botCard.contractAddress}
                isContractVerified={botCard.isContractVerified}
                onContractAddressUpdated={async () => {
                  await botCard.refreshContractMetadata();
                  await botCard.loadMyProfile();
                }}
              />
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BotCardShell />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

