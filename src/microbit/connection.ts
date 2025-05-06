import { createWebUSBConnection, MicrobitWebUSBConnection } from "@microbit/microbit-connection";
import { ConnectionStatus } from "@microbit/microbit-connection";
import { SerialDataEvent } from "@microbit/microbit-connection";
//import Plotly from "plotly.js-dist";
import { handleConfig, handleData, GraphConfig, PlotData } from "../utils/messageHandler";

export class MicrobitConnectorUSB {
    private usb: MicrobitWebUSBConnection | null = null;
    private dataBuffer: string = "";
    private graphConfig: GraphConfig | null = null; // Store the latest configuration
    private plotData: PlotData = {}; // Stores sensor traces

    async connect(): Promise<boolean> {
        try {
            this.usb = createWebUSBConnection();
            const status = await this.usb.connect();
            console.log("Micro:bit connection status:", status);

            if (status === ConnectionStatus.CONNECTED) {
                console.log("Setting up serial data event listener...");
                if (this.usb) { // remove existing event listener
                    this.usb.removeEventListener("serialdata", this.handleSerialData.bind(this));
                }
                this.usb.addEventListener("serialdata", this.handleSerialData.bind(this));
                console.log("Serial data event listener added.");
                this.updateStatus("Connected");

                this.usb.serialWrite("dataplot\n");
                return true;
            } else {
                console.error("Failed to connect to micro:bit. Status:", status);
                this.updateStatus("Failed to connect");
            }
        } catch (error) {
            console.error("Connection failed:", error);
            this.updateStatus("Connection failed");
        }
        return false;
    }

    disconnect() {
        if (this.usb) {
            this.usb.disconnect();
            console.log("Micro:bit disconnected.");
            this.updateStatus("Disconnected");
        }
    }

    private handleSerialData(event: SerialDataEvent) {
        console.log("Serial data received:", event.data);
    
        // ✅ Preserve `\n` and append data as-is to avoid breaking JSON format
        this.dataBuffer += event.data;
        //console.log("Data arrived: ", event.data);
    
        // ✅ Process only complete JSON objects
        let newlineIndex;
        while ((newlineIndex = this.dataBuffer.indexOf("\n")) !== -1) {
            let jsonString = this.dataBuffer.slice(0, newlineIndex); // ✅ Extract JSON (DO NOT trim)
            this.dataBuffer = this.dataBuffer.slice(newlineIndex + 1); // ✅ Remove processed JSON
    
            if (jsonString.trim().length==0) {
                jsonString = "";
                continue; // ✅ Ignore empty lines
            }
    
            try {
                console.log("Attempting to parse JSON:", jsonString);
                const parsedData = JSON.parse(jsonString);
                console.log("✅ Successfully parsed:", parsedData);
    
                // ✅ Handle different message types
                if (parsedData.type === "config") {
                    this.graphConfig = handleConfig(parsedData, this.graphConfig, this.plotData);
                } else if (parsedData.type === "data") {
                    handleData(parsedData, this.graphConfig);
                }
            } catch (error) {
                console.warn("❌ JSON Parse Error:", error);
                console.warn("Faulty JSON:", jsonString);
            }
        }
    }

    private updateStatus(status: string) {
        const statusElement = document.getElementById("status");
        if (statusElement) {
            statusElement.textContent = `Status: ${status}`;
        }
    }

    public getUsbConnection(): MicrobitWebUSBConnection | null {
        return this.usb;
    }
}
