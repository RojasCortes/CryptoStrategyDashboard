-- Simulation System Schema
-- This schema adds paper trading / simulation capabilities

-- Simulation Sessions Table
-- Tracks individual simulation runs with starting capital and date ranges
CREATE TABLE simulation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initial_balance DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
  current_balance DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'stopped'
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_profit_loss DOUBLE PRECISION DEFAULT 0.0,
  max_drawdown DOUBLE PRECISION DEFAULT 0.0,
  return_percentage DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Simulation Trades Table
-- Records each simulated trade executed during a simulation
CREATE TABLE simulation_trades (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  type TEXT NOT NULL, -- 'BUY' or 'SELL'
  price DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  fee DOUBLE PRECISION DEFAULT 0.0,
  total DOUBLE PRECISION NOT NULL,
  balance_after DOUBLE PRECISION NOT NULL,
  profit_loss DOUBLE PRECISION DEFAULT 0.0,
  reason TEXT, -- Why the trade was made (e.g., "RSI oversold", "Take profit hit")
  executed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simulation Portfolio Table
-- Tracks current holdings in a simulation
CREATE TABLE simulation_portfolio (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  average_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(simulation_id, asset)
);

-- Simulation Balance History Table
-- Tracks balance over time for performance charts
CREATE TABLE simulation_balance_history (
  id SERIAL PRIMARY KEY,
  simulation_id INTEGER NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  balance DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX idx_simulation_sessions_user_id ON simulation_sessions(user_id);
CREATE INDEX idx_simulation_sessions_strategy_id ON simulation_sessions(strategy_id);
CREATE INDEX idx_simulation_sessions_status ON simulation_sessions(status);
CREATE INDEX idx_simulation_sessions_created_at ON simulation_sessions(created_at DESC);

CREATE INDEX idx_simulation_trades_simulation_id ON simulation_trades(simulation_id);
CREATE INDEX idx_simulation_trades_user_id ON simulation_trades(user_id);
CREATE INDEX idx_simulation_trades_strategy_id ON simulation_trades(strategy_id);
CREATE INDEX idx_simulation_trades_executed_at ON simulation_trades(executed_at DESC);

CREATE INDEX idx_simulation_portfolio_simulation_id ON simulation_portfolio(simulation_id);

CREATE INDEX idx_simulation_balance_history_simulation_id ON simulation_balance_history(simulation_id);
CREATE INDEX idx_simulation_balance_history_timestamp ON simulation_balance_history(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_balance_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own simulation data
CREATE POLICY "Users can view own simulation sessions" ON simulation_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own simulation sessions" ON simulation_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own simulation sessions" ON simulation_sessions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own simulation sessions" ON simulation_sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own simulation trades" ON simulation_trades
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own simulation trades" ON simulation_trades
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own simulation portfolio" ON simulation_portfolio
  FOR SELECT USING (
    simulation_id IN (
      SELECT id FROM simulation_sessions WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can modify own simulation portfolio" ON simulation_portfolio
  FOR ALL USING (
    simulation_id IN (
      SELECT id FROM simulation_sessions WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own simulation balance history" ON simulation_balance_history
  FOR SELECT USING (
    simulation_id IN (
      SELECT id FROM simulation_sessions WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own simulation balance history" ON simulation_balance_history
  FOR INSERT WITH CHECK (
    simulation_id IN (
      SELECT id FROM simulation_sessions WHERE user_id::text = auth.uid()::text
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_simulation_sessions_updated_at BEFORE UPDATE ON simulation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_portfolio_updated_at BEFORE UPDATE ON simulation_portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
