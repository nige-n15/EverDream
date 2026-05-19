import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateWallet,
  getWallet,
  updateWalletName,
  createDreamNFT,
  createCombinedNFT,
  mintNFT,
  getWalletNFTs,
  saveNFT,
  exportNFTMetadata,
  type WalletIdentity,
  type DreamNFT,
} from '../lib/nft';

describe('NFT Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Wallet Management', () => {
    it('should create a new wallet when none exists', () => {
      const wallet = getOrCreateWallet();
      expect(wallet).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-f0-9]{40}$/);
      expect(wallet.displayName).toMatch(/^dreamer_[a-f0-9]{6}$/);
      expect(wallet.createdAt).toBeDefined();
      expect(wallet.deviceId).toBeDefined();
    });

    it('should return existing wallet on subsequent calls', () => {
      const wallet1 = getOrCreateWallet();
      const wallet2 = getOrCreateWallet();
      expect(wallet1.address).toBe(wallet2.address);
      expect(wallet1.deviceId).toBe(wallet2.deviceId);
    });

    it('should return null from getWallet when no wallet exists', () => {
      const wallet = getWallet();
      expect(wallet).toBeNull();
    });

    it('should return wallet from getWallet after creation', () => {
      const created = getOrCreateWallet();
      const retrieved = getWallet();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.address).toBe(created.address);
    });

    it('should update wallet display name', () => {
      getOrCreateWallet();
      const updated = updateWalletName('TestDreamer');
      expect(updated).not.toBeNull();
      expect(updated!.displayName).toBe('TestDreamer');
    });

    it('should return null when updating name with no wallet', () => {
      const result = updateWalletName('TestDreamer');
      expect(result).toBeNull();
    });
  });

  describe('NFT Creation', () => {
    const mockWallet: WalletIdentity = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      displayName: 'test_dreamer',
      createdAt: new Date().toISOString(),
      deviceId: 'test-device',
    };

    it('should create a DreamNFT from a dream object', () => {
      const dream = {
        id: 'dream-1',
        nugget: 'Flying over mountains',
        narrative: 'I was flying over vast mountains...',
        category: 'adventure',
        emotion: 'joy',
        themes: ['flying', 'freedom', 'nature'],
        captureMode: 'text',
        date: new Date().toISOString(),
      };

      const nft = createDreamNFT(dream, mockWallet);

      expect(nft.id).toBe('dxp-dream-1');
      expect(nft.dreamId).toBe('dream-1');
      expect(nft.owner).toBe(mockWallet.address);
      expect(nft.creator).toBe(mockWallet.address);
      expect(nft.status).toBe('pending');
      expect(nft.license).toBe('copyleft');
      expect(nft.allowRemix).toBe(true);
      expect(nft.metadata.name).toBe('Flying over mountains');
      expect(nft.metadata.attributes.length).toBeGreaterThan(0);
    });

    it('should handle dream with minimal data', () => {
      const dream = { id: 'dream-2', content: 'Short dream' };
      const nft = createDreamNFT(dream, mockWallet);

      expect(nft.id).toBe('dxp-dream-2');
      expect(nft.metadata.name).toBe('Untitled Dream');
    });

    it('should include facial emotion in attributes when present', () => {
      const dream = {
        id: 'dream-3',
        nugget: 'Test',
        capturedEmotions: { dominantEmotion: 'happy' },
        category: 'peaceful',
        emotion: 'calm',
        themes: [],
        captureMode: 'text',
        date: new Date().toISOString(),
      };

      const nft = createDreamNFT(dream, mockWallet);
      const emotionAttr = nft.metadata.attributes.find(a => a.trait_type === 'Facial Emotion');
      expect(emotionAttr).toBeDefined();
      expect(emotionAttr!.value).toBe('happy');
    });

    it('should include sleep data in attributes when present', () => {
      const dream = {
        id: 'dream-4',
        nugget: 'Test',
        sleepData: { quality: 85, estimatedREM: 120 },
        category: 'peaceful',
        emotion: 'calm',
        themes: [],
        captureMode: 'text',
        date: new Date().toISOString(),
      };

      const nft = createDreamNFT(dream, mockWallet);
      const scoreAttr = nft.metadata.attributes.find(a => a.trait_type === 'Sleep Score');
      const remAttr = nft.metadata.attributes.find(a => a.trait_type === 'REM Minutes');
      expect(scoreAttr).toBeDefined();
      expect(scoreAttr!.value).toBe(85);
      expect(remAttr).toBeDefined();
      expect(remAttr!.value).toBe(120);
    });
  });

  describe('Combined NFT', () => {
    const mockWallet: WalletIdentity = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      displayName: 'test_dreamer',
      createdAt: new Date().toISOString(),
      deviceId: 'test-device',
    };

    const parentNFTs: DreamNFT[] = [
      {
        id: 'dxp-parent-1',
        dreamId: 'dream-1',
        owner: '0xaaa',
        creator: '0xaaa',
        metadata: { name: 'Parent 1', description: '', attributes: [] },
        status: 'minted',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'dxp-parent-2',
        dreamId: 'dream-2',
        owner: '0xbbb',
        creator: '0xbbb',
        metadata: { name: 'Parent 2', description: '', attributes: [] },
        status: 'minted',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      },
    ];

    it('should create a combined NFT with 50:50 royalty split', () => {
      const combined = createCombinedNFT(
        parentNFTs,
        { title: 'Combined Dream', narrative: 'A fusion...', themes: ['fusion'] },
        mockWallet
      );

      expect(combined.parents).toEqual(['dxp-parent-1', 'dxp-parent-2']);
      expect(combined.royaltySplits).toBeDefined();
      expect(combined.royaltySplits!.length).toBe(2);
      expect(combined.royaltySplits![0].share).toBe(5000);
      expect(combined.royaltySplits![1].share).toBe(5000);
      expect(combined.license).toBe('cc-by-sa');
    });

    it('should handle single parent', () => {
      const combined = createCombinedNFT(
        [parentNFTs[0]],
        { title: 'Solo Remix', narrative: 'A remix...', themes: ['remix'] },
        mockWallet
      );

      expect(combined.parents).toEqual(['dxp-parent-1']);
      expect(combined.royaltySplits![0].share).toBe(10000);
    });
  });

  describe('NFT Minting', () => {
    it('should mark NFT as minted with tx hash', async () => {
      const nft: DreamNFT = {
        id: 'dxp-test',
        dreamId: 'dream-1',
        owner: '0x123',
        creator: '0x123',
        metadata: { name: 'Test', description: '', attributes: [] },
        status: 'pending',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      };

      const minted = await mintNFT(nft);

      expect(minted.status).toBe('minted');
      expect(minted.txHash).toBeDefined();
      expect(minted.txHash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(minted.contractAddress).toBeDefined();
      expect(minted.tokenId).toBeDefined();
    });
  });

  describe('NFT Storage', () => {
    it('should save and retrieve NFTs', () => {
      const nft: DreamNFT = {
        id: 'dxp-storage-test',
        dreamId: 'dream-1',
        owner: '0x123',
        creator: '0x123',
        metadata: { name: 'Storage Test', description: '', attributes: [] },
        status: 'pending',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      };

      saveNFT(nft);
      const retrieved = getWalletNFTs('0x123');

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('dxp-storage-test');
    });

    it('should update existing NFT on save', () => {
      const nft: DreamNFT = {
        id: 'dxp-update-test',
        dreamId: 'dream-1',
        owner: '0x123',
        creator: '0x123',
        metadata: { name: 'Original', description: '', attributes: [] },
        status: 'pending',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      };

      saveNFT(nft);
      nft.status = 'minted';
      saveNFT(nft);

      const retrieved = getWalletNFTs('0x123');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].status).toBe('minted');
    });

    it('should return empty array for wallet with no NFTs', () => {
      const retrieved = getWalletNFTs('0xnonexistent');
      expect(retrieved).toEqual([]);
    });
  });

  describe('NFT Export', () => {
    it('should export NFT metadata in OpenSea format', () => {
      const nft: DreamNFT = {
        id: 'dxp-export-test',
        dreamId: 'dream-1',
        owner: '0x123',
        creator: '0x123',
        metadata: {
          name: 'Export Test',
          description: 'A test NFT',
          image: 'https://example.com/image.png',
          attributes: [{ trait_type: 'Category', value: 'adventure' }],
        },
        status: 'minted',
        license: 'copyleft',
        allowRemix: true,
        createdAt: new Date().toISOString(),
      };

      const exported = exportNFTMetadata(nft);

      expect(exported).toEqual({
        name: 'Export Test',
        description: 'A test NFT',
        image: 'https://example.com/image.png',
        animation_url: undefined,
        external_url: undefined,
        attributes: [{ trait_type: 'Category', value: 'adventure' }],
        properties: {
          category: 'dream',
          creators: [{ address: '0x123', share: 100 }],
          royalty: [],
        },
      });
    });
  });
});
