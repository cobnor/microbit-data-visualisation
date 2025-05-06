// src/components/ConnectButton.tsx

import React, { useState } from 'react';
import './ConnectButton.css';

import { MicrobitConnectorUSB } from '../microbit/connection';
import { MicrobitConnectorBluetooth } from '../bluetooth/connection';


export interface ConnectButtonProps {
  /** The two connector instances created in App.tsx */
  usbConnector: MicrobitConnectorUSB;
  bluetoothConnector: MicrobitConnectorBluetooth;

  /** Called once we’ve successfully connected (USB or bluetooth) */
  onConnect: () => void;

  /** Called when user disconnects */
  onDisconnect: () => void;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  usbConnector,
  bluetoothConnector,
  onConnect,
  onDisconnect
}) => {
  const [connector, setConnector]   = useState<MicrobitConnectorUSB | MicrobitConnectorBluetooth | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isConnected = Boolean(connector);

  /** Main button click: open dialog or disconnect */
  const handleMainClick = () => {
    if (isConnected) {
      usbConnector.disconnect();
      bluetoothConnector.disconnect();
      setConnector(null);
      onDisconnect();
    } else {
      setShowDialog(true);
    }
  };

  /** User selects USB vs. Bluetooth */
  const choose = async (type: 'USB' | 'Bluetooth') => {
    setShowDialog(false);
    setConnecting(true);

    const candidate = type === 'USB' ? usbConnector : bluetoothConnector;
    try {
      const ok = await candidate.connect();
      if (ok) {
        setConnector(candidate);
        onConnect();
      } else {
        alert(`Failed to connect via ${type}.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error connecting via ${type}: ${err}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
      <button
        className={`connectBtn ${isConnected ? 'connected' : ''}`}
        onClick={handleMainClick}
        disabled={connecting}
      >
        {connecting
          ? '...'
          : isConnected
            ? 'Disconnect'
            : 'Connect'}
      </button>

      {showDialog && (
        <div
          className="connect-dialog-overlay"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="connect-dialog"
            onClick={e => e.stopPropagation()}
          >
            <p>Select connection type:</p>
            <div className="dialog-buttons">
              <button onClick={() => choose('USB')}>USB</button>
              <button onClick={() => choose('Bluetooth')}>Bluetooth</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectButton;
