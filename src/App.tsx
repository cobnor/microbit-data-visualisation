import { useState } from 'react';
import './App.css';

import Header from './components/Header';
import ConnectButton from './components/ConnectButton';
import Sidebar from './components/Sidebar';
import SidebarButton from './components/SidebarButton';
import Card from './components/Card';
import GraphOptionButton from './components/GraphOptionButton';

import { MicrobitConnectorUSB } from './microbit/connection';
import { MicrobitConnectorBluetooth } from './bluetooth/connection';

import {
	flashMicrobitUSBAccelerometer,
	flashMicrobitUSBAccelerometerScatter,
	flashMicrobitUSBButtons,
	flashMicrobitUSBButtonsPie,
	flashMicrobitUSBButtonsBluetooth
} from './microbit/flasher';


// Connection and flashing handlers

const microbitConnectorUSB = new MicrobitConnectorUSB();
const microbitConnectorBluetooth = new MicrobitConnectorBluetooth();

async function setupMicrobitUSB() {
	try {
		const isConnected = await microbitConnectorUSB.connect();
		if (!isConnected) console.log("Failed to connect via USB");
	} catch (e) {
		console.error(e);
	}
}

async function setupMicrobitBluetooth() {
    try {
        const isConnected = await microbitConnectorBluetooth.connect();
        if (isConnected) {
            console.log("Micro:bit connected!");
            // Add any additional logic to handle after successful connection
        } else {
            console.log("Failed to connect to Micro:bit.");
        }
    } catch (error) {
        console.error("Error connecting to Micro:bit:", error);
    }
}

function disconnectMicrobit() {
	microbitConnectorUSB.disconnect();
	microbitConnectorBluetooth.disconnect();
}

async function flashMicrobitHandlerAccelerometer() {
	try {
		const usb = microbitConnectorUSB.getUsbConnection();
		if (usb) {
			await flashMicrobitUSBAccelerometer(usb);
			console.log("Flashed accelerometer!");
			setupMicrobitUSB();
		} else {
			console.log("USB not initialized");
		}
	} catch (err) {
		console.error(err);
	}
}

async function flashMicrobitHandlerAccelerometerScatter() {
	try {
		const usb = microbitConnectorUSB.getUsbConnection();
		if (usb) {
			await flashMicrobitUSBAccelerometerScatter(usb);
			console.log("Flashed scatter!");
			setupMicrobitUSB();
		} else {
			console.log("USB not initialized");
		}
	} catch (err) {
		console.error(err);
	}
}

async function flashMicrobitHandlerButtons() {
	try {
		const usb = microbitConnectorUSB.getUsbConnection();
		if (usb) {
			await flashMicrobitUSBButtons(usb);
			console.log("Flashed buttons bar!");
			setupMicrobitUSB();
		} else {
			console.log("USB not initialized");
		}
	} catch (err) {
		console.error(err);
	}
}

async function flashMicrobitHandlerButtonsPie() {
	try {
		const usb = microbitConnectorUSB.getUsbConnection();
		if (usb) {
			await flashMicrobitUSBButtonsPie(usb);
			console.log("Flashed buttons pie!");
			setupMicrobitUSB();
		} else {
			console.log("USB not initialized");
		}
	} catch (err) {
		console.error(err);
	}
}

async function flashMicrobitHandlerButtonsBluetooth() {
    try {
        const usb = microbitConnectorUSB.getUsbConnection();
        if (usb) {
            await flashMicrobitUSBButtonsBluetooth(usb);
            console.log("Micro:bit flashed successfully!");
            setupMicrobitBluetooth();
        } else {
            console.log("Micro:bit USB connection is not initialized.");
        }
    } catch (error) {
        console.error("Error flashing Micro:bit:", error);
    }
}


/////////////////////////////////////////


export default function App() {

	type Mode = 'none' | 'graph' | 'table' | 'demo';
	const [mode, setMode]				 = useState<Mode>('none');
	const [connected, setConnected] = useState(false);

	return (
		<div className={`gradient-bg ${mode}`}>
			<div className="bg-none" />
			<div className="bg-graph" />
			<div className="bg-table" />

			<Header>
				<ConnectButton
					usbConnector={microbitConnectorUSB}
					bluetoothConnector={microbitConnectorBluetooth}
					onConnect={() => {
						setConnected(true);
                        if (mode == "none"){
                            setMode("graph")
                        }
					}}
					onDisconnect={() => {
						disconnectMicrobit();
						setConnected(false);
                        setMode("none");
					}}
				/>
			</Header>

			<Sidebar>
				<SidebarButton text="Graph" onClick={() => setMode('graph')} active={mode === 'graph'} />
				<SidebarButton text="Table" onClick={() => setMode('table')} active={mode === 'table'} />
				<SidebarButton text="Demo" onClick={() => setMode('demo')} active={mode === 'demo'} />
			</Sidebar>

			{mode === 'none' ? (
				<Card transparent>
					<div className="opening-container">
						<h1>&nbsp;Connect your micro:bit to begin.</h1>
					</div>
				</Card>
			) : (
				<Card>
					
					{mode === 'graph' && (
						<>
							<div className="card-header">
								<h1>Graphing</h1>
								<p className="infoText">View your data in a graph.</p>
							</div>
						</>
					)}
					
                    {mode === 'table' && (
						<>
							<div className="card-header">
								<h1>Tablulate</h1>
								<p className="infoText">View your data in a table.</p>
							</div>
						</>
					)}
                    {mode === "demo" && (
                        <>
						<div className="card-header">
							<h1>Demos</h1>
							<div className="demos">
								<GraphOptionButton
									text="Accelerometer - Line Graph"
									onClick={flashMicrobitHandlerAccelerometer}
								/>
								<GraphOptionButton
									text="Accelerometer - Scatter Graph"
									onClick={flashMicrobitHandlerAccelerometerScatter}
								/>
								<GraphOptionButton
									text="Buttons - Bar Chart"
									onClick={flashMicrobitHandlerButtons}
								/>
								<GraphOptionButton
									text="Buttons - Pie Chart"
									onClick={flashMicrobitHandlerButtonsPie}
								/>
								<GraphOptionButton
									text="BT - Buttons"
									onClick={flashMicrobitHandlerButtonsBluetooth}
								/>
							</div>
						</div>
							<p className="infoText">Flash your microbit with demo graphing programs.</p>
							<div className='flashInfo'>
								<div id="flashStatus">Flashing status:&nbsp;&nbsp;</div>
								<progress id="flashProgress" value={0} max={1} />
							</div>
                        </>
                    )}
					
					<div id="plot"></div>
					
				</Card>
			)}
		</div>
	);
}
