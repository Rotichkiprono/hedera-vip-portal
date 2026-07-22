-- Create Enum for Digital Asset Types
CREATE TYPE asset_type_enum AS ENUM ('VIP_PASS', 'LOYALTY_POINT', 'COLLECTIBLE');

-- 1. Users Table (Bridges Supabase Auth with Hedera Wallet)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  evm_address TEXT UNIQUE,
  hedera_account_id TEXT UNIQUE,
  phone_number TEXT UNIQUE, -- For M-Pesa tracking
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Digital Assets Table (Maps UI metadata to HTS Token IDs)
CREATE TABLE public.digital_assets (
  hts_token_id TEXT PRIMARY KEY, -- e.g. 0.0.123456
  asset_type asset_type_enum NOT NULL,
  metadata_uri TEXT NOT NULL, -- IPFS CID
  contract_address TEXT NOT NULL, -- Managing HSCS contract (0x...)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Transactions Table (Idempotent Bridge for M-Pesa & Hedera)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  checkout_request_id TEXT UNIQUE, -- Safaricom Daraja ID
  mpesa_receipt_number TEXT UNIQUE,
  hts_token_id TEXT REFERENCES public.digital_assets(hts_token_id),
  amount_kes NUMERIC(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'FIAT_CLEARED', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING',
  hedera_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. HCS Engagement Logs Table (Auditable off-chain mirror of HCS topic logs)
CREATE TABLE public.engagement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hcs_topic_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;

-- Basic Read Policies
CREATE POLICY "Allow public read access to digital assets" ON public.digital_assets FOR SELECT USING (true);
CREATE POLICY "Allow users to read own data" ON public.users FOR SELECT USING (auth.uid() = id);
