// utils/ethereum.ts
// Proper TypeScript handling for MetaMask integration

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      selectedAddress: string | null;
      chainId: string;
    };
  }
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  selectedAddress: string | null;
  chainId: string;
}

export const getEthereumProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).ethereum || null;
};

export const isMetaMaskInstalled = (): boolean => {
  const ethereum = getEthereumProvider();
  return !!(ethereum && ethereum.isMetaMask);
};

export const connectWallet = async (): Promise<string[]> => {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts;
  } catch (error) {
    throw new Error('User rejected connection');
  }
};

export const switchToIntuitionTestnet = async (): Promise<void> => {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error('MetaMask not installed');
  }

  const chainId = '0x350B'; // 13579 in hex
  
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError: any) {
    // Chain not added to MetaMask
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: 'Intuition Testnet',
              nativeCurrency: {
                name: 'tTRUST',
                symbol: 'tTRUST',
                decimals: 18,
              },
              rpcUrls: ['http://testnet.rpc.intuition.systems'],
              blockExplorerUrls: ['https://testnet.explorer.intuition.systems'],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add Intuition Testnet');
      }
    } else {
      throw new Error('Failed to switch to Intuition Testnet');
    }
  }
};

export const getCurrentAccount = async (): Promise<string | null> => {
  const ethereum = getEthereumProvider();
  if (!ethereum) return null;

  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    return null;
  }
};