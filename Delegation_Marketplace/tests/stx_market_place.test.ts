import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock for the Clarity VM interactions
const mockClarity = {
  // Mock contract state
  contractState: {
    'marketplace-contract': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.delegation-marketplace'
  },
  
  // Mock principals
  principals: {
    contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    marketplace: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.delegation-marketplace',
    user1: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
    user2: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND'
  },
  
  // Mock contract caller
  contractCaller: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  
  // Mock tx-sender
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  
  // Mock function to set contract caller
  setContractCaller(principal) {
    this.contractCaller = principal;
    return this;
  },
  
  // Mock function to set tx-sender
  setTxSender(principal) {
    this.txSender = principal;
    return this;
  },
  
  // Mock function to get data var
  getDataVar(name) {
    return this.contractState[name];
  },
  
  // Mock function to set data var
  setDataVar(name, value) {
    this.contractState[name] = value;
    return { success: true };
  },
  
  // Mock error codes
  errors: {
    ERR_OWNER_ONLY: 100,
    ERR_UNAUTHORIZED: 101,
    ERR_INVALID_POX: 102,
    ERR_DELEGATION_FAILED: 103
  }
};

// Mock implementation of the contract functions
const stxDelegator = {
  setMarketplaceContract(newContract) {
    if (mockClarity.txSender !== mockClarity.principals.contractOwner) {
      return { error: mockClarity.errors.ERR_OWNER_ONLY };
    }
    
    mockClarity.setDataVar('marketplace-contract', newContract);
    return { value: newContract };
  },
  
  delegateToPox(amount, poxAddress, startBurnHeight, lockPeriod) {
    // Check if caller is the marketplace contract
    if (mockClarity.contractCaller !== mockClarity.getDataVar('marketplace-contract')) {
      return { error: mockClarity.errors.ERR_UNAUTHORIZED };
    }
    
    // Validate PoX address
    if (poxAddress.version !== '0x01' || poxAddress.hashbytes.length !== 20) {
      return { error: mockClarity.errors.ERR_INVALID_POX };
    }
    
    // In a real implementation, this would call the actual PoX contract
    return { value: true };
  },
  
  revokeDelegation(amount) {
    // Check if caller is the marketplace contract
    if (mockClarity.contractCaller !== mockClarity.getDataVar('marketplace-contract')) {
      return { error: mockClarity.errors.ERR_UNAUTHORIZED };
    }
    
    // In a real implementation, this would call the actual PoX contract
    return { value: true };
  },
  
  getMarketplaceContract() {
    return mockClarity.getDataVar('marketplace-contract');
  },
  
  isValidPoxAddress(poxAddress) {
    return poxAddress.version === '0x01' && poxAddress.hashbytes.length === 20;
  }
};

describe("STX Delegator Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
    mockClarity.contractState = {
      'marketplace-contract': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.delegation-marketplace'
    };
    mockClarity.setContractCaller(mockClarity.principals.contractOwner);
    mockClarity.setTxSender(mockClarity.principals.contractOwner);
  });

  describe("set-marketplace-contract", () => {
    it("should allow contract owner to set marketplace contract", () => {
      const newMarketplace = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.new-marketplace';
      
      const result = stxDelegator.setMarketplaceContract(newMarketplace);
      
      expect(result).toHaveProperty('value', newMarketplace);
      expect(mockClarity.getDataVar('marketplace-contract')).toBe(newMarketplace);
    });

    it("should reject non-owner attempts to set marketplace contract", () => {
      mockClarity.setTxSender(mockClarity.principals.user1);
      const newMarketplace = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.new-marketplace';
      
      const result = stxDelegator.setMarketplaceContract(newMarketplace);
      
      expect(result).toHaveProperty('error', mockClarity.errors.ERR_OWNER_ONLY);
      expect(mockClarity.getDataVar('marketplace-contract')).toBe(mockClarity.principals.marketplace);
    });
  });

  describe("delegate-to-pox", () => {
    it("should allow marketplace contract to delegate STX to a valid PoX address", () => {
      mockClarity.setContractCaller(mockClarity.principals.marketplace);
      
      const amount = 10000000; // 10 STX
      const poxAddress = {
        version: '0x01',
        hashbytes: '0123456789abcdef012345' // 20 bytes
      };
      const startBurnHeight = 100;
      const lockPeriod = 10;
      
      const result = stxDelegator.delegateToPox(amount, poxAddress, startBurnHeight, lockPeriod);
      
      expect(result).toHaveProperty('value', true);
    });

    it("should reject delegation from unauthorized callers", () => {
      mockClarity.setContractCaller(mockClarity.principals.user1);
      
      const amount = 10000000; // 10 STX
      const poxAddress = {
        version: '0x01',
        hashbytes: '0123456789abcdef012345' // 20 bytes
      };
      const startBurnHeight = 100;
      const lockPeriod = 10;
      
      const result = stxDelegator.delegateToPox(amount, poxAddress, startBurnHeight, lockPeriod);
      
      expect(result).toHaveProperty('error', mockClarity.errors.ERR_UNAUTHORIZED);
    });

    it("should reject delegation with invalid PoX address version", () => {
      mockClarity.setContractCaller(mockClarity.principals.marketplace);
      
      const amount = 10000000; // 10 STX
      const poxAddress = {
        version: '0x02', // Invalid version
        hashbytes: '0123456789abcdef012345' // 20 bytes
      };
      const startBurnHeight = 100;
      const lockPeriod = 10;
      
      const result = stxDelegator.delegateToPox(amount, poxAddress, startBurnHeight, lockPeriod);
      
      expect(result).toHaveProperty('error', mockClarity.errors.ERR_INVALID_POX);
    });

    it("should reject delegation with invalid PoX address hashbytes length", () => {
      mockClarity.setContractCaller(mockClarity.principals.marketplace);
      
      const amount = 10000000; // 10 STX
      const poxAddress = {
        version: '0x01',
        hashbytes: '0123456789abcdef' // Only 16 bytes, should be 20
      };
      const startBurnHeight = 100;
      const lockPeriod = 10;
      
      const result = stxDelegator.delegateToPox(amount, poxAddress, startBurnHeight, lockPeriod);
      
      expect(result).toHaveProperty('error', mockClarity.errors.ERR_INVALID_POX);
    });
  });

  describe("revoke-delegation", () => {
    it("should allow marketplace contract to revoke delegation", () => {
      mockClarity.setContractCaller(mockClarity.principals.marketplace);
      
      const amount = 10000000; // 10 STX
      
      const result = stxDelegator.revokeDelegation(amount);
      
      expect(result).toHaveProperty('value', true);
    });

    it("should reject revocation from unauthorized callers", () => {
      mockClarity.setContractCaller(mockClarity.principals.user1);
      
      const amount = 10000000; // 10 STX
      
      const result = stxDelegator.revokeDelegation(amount);
      
      expect(result).toHaveProperty('error', mockClarity.errors.ERR_UNAUTHORIZED);
    });
  });

  describe("is-valid-pox-address", () => {
    it("should validate correct PoX addresses", () => {
      const validPoxAddress = {
        version: '0x01',
        hashbytes: '0123456789abcdef012345' // 20 bytes
      };
      
      const result = stxDelegator.isValidPoxAddress(validPoxAddress);
      
      expect(result).toBe(true);
    });

    it("should reject PoX addresses with incorrect version", () => {
      const invalidVersionPoxAddress = {
        version: '0x02', // Invalid version
        hashbytes: '0123456789abcdef012345' // 20 bytes
      };
      
      const result = stxDelegator.isValidPoxAddress(invalidVersionPoxAddress);
      
      expect(result).toBe(false);
    });

    it("should reject PoX addresses with incorrect hashbytes length", () => {
      const invalidHashbytesPoxAddress = {
        version: '0x01',
        hashbytes: '0123456789abcdef' // Only 16 bytes, should be 20
      };
      
      const result = stxDelegator.isValidPoxAddress(invalidHashbytesPoxAddress);
      
      expect(result).toBe(false);
    });
  });

  describe("get-marketplace-contract", () => {
    it("should return the current marketplace contract", () => {
      const result = stxDelegator.getMarketplaceContract();
      
      expect(result).toBe(mockClarity.principals.marketplace);
    });

    it("should return the updated marketplace contract after change", () => {
      const newMarketplace = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.new-marketplace';
      stxDelegator.setMarketplaceContract(newMarketplace);
      
      const result = stxDelegator.getMarketplaceContract();
      
      expect(result).toBe(newMarketplace);
    });
  });
});