export type WbCustomServices = Object;

export type WbRequestDevice = (bluetooth: Bluetooth) => Promise<BluetoothDevice | undefined>;
export type WbRetrieveServices = (device: BluetoothDevice) => Promise<WbCustomServices>;
export type GattServerDisconnectedCallback = () => void;

const defalutGattServerDisconnectedCallback: GattServerDisconnectedCallback = () => {
    console.log("missing GattServerDisconnectedCallback.");
};

type Bound<T> = { target: T, binding: boolean };
export type WbBoundCallback<T> = (bound: Bound<T>) => void;

export class WbConnection {

    constructor(retrieveServices: WbRetrieveServices, requestDevice: WbRequestDevice, bluetooth: Bluetooth, name: string = "") {
        this.name = name;
        this.bluetooth = bluetooth;
        this.asyncRequestDevice = requestDevice;
        this.asyncRetrieveServices = retrieveServices;
    }

    public name: string;
    private bluetooth: Bluetooth;
    private asyncRequestDevice: WbRequestDevice;
    private asyncRetrieveServices: WbRetrieveServices;

    private gattServerDisconnectedEventCallback: GattServerDisconnectedCallback = defalutGattServerDisconnectedCallback;

    private deviceCallbacks: WbBoundCallback<BluetoothDevice>[] = [];
    private device?: BluetoothDevice;

    private servicesCallbacks: WbBoundCallback<WbCustomServices>[] = [];
    private services?: WbCustomServices;

    public setGattServerDisconnectedCallback(cb?: GattServerDisconnectedCallback) {
        this.gattServerDisconnectedEventCallback = cb ?? defalutGattServerDisconnectedCallback;
    }

    public async doRequestDevice() {
        const device = await this.asyncRequestDevice(this.bluetooth);
        this.setDevice(device);
    }

    public resetDevice() {
        this.setServices(undefined);
        this.setDevice(undefined);
    }

    public async doRetrieveServices() {
        const services = await this.asyncRetrieveServices(this.device!);
        this.setServices(services);
    }

    public resetServices() {
        this.setServices(undefined);
    }

    public disconnectGattServer() {
        if (this.device && this.device.gatt /*&& this.device.gatt.connected*/) {
            if (!this.device.gatt.connected) {
                console.log("Gatt Server has already been disconnected.")
            }
            this.device.gatt.disconnect();
        } else {
            console.log("missing Gatt Server connection.")
        }
    }

    public addDeviceBoundCallback(cb: WbBoundCallback<BluetoothDevice>) {
        this.deviceCallbacks.push(cb);
        if (this.device) {
            cb({ target: this.device, binding: true }); // bind
        }
    }

    public removeDeviceBoundCallback(cb: WbBoundCallback<BluetoothDevice>) {
        this.deviceCallbacks = this.deviceCallbacks.filter(f => {
            if (f === cb) {
                if (this.device) {
                    cb({ target: this.device, binding: false }); // unbind
                }
                return false;
            }
            return true;
        });
    }

    private updateDeviceBoundCallbacksAll(binding: boolean): boolean {
        const target = this.device;
        if (target) {
            const bound: Bound<BluetoothDevice> = { target, binding }
            this.deviceCallbacks.forEach(f => f(bound)); // binding, bind/unbind
            return true;
        }
        return false;
    }

    private setDevice(device?: BluetoothDevice) {
        const gattserverdisconnected = "gattserverdisconnected";
        this.updateDeviceBoundCallbacksAll(false); // unbind all
        if (this.device) {
            this.device.removeEventListener(gattserverdisconnected, this.gattServerDisconnectedEventCallback);
        }
        this.device = device; // change
        if (this.device) {
            this.device.addEventListener(gattserverdisconnected, this.gattServerDisconnectedEventCallback);
        }
        this.updateDeviceBoundCallbacksAll(true); // bind all
    }

    public addServicesBoundCallback(cb: WbBoundCallback<WbCustomServices>) {
        this.servicesCallbacks.push(cb);
        if (this.services) {
            cb({ target: this.services, binding: true }); //bind
        }
    }

    public removeServicesBoundCallback(cb: WbBoundCallback<WbCustomServices>) {
        this.servicesCallbacks = this.servicesCallbacks.filter(f => {
            if (f === cb) {
                if (this.services) {
                    f({ target: this.services, binding: false }); // unbind
                }
                return false;
            }
            return true;
        });
    }

    private updateServicesBoundCallbacksAll(binding: boolean) {
        const target = this.services;
        if (target) {
            const bound: Bound<WbCustomServices> = { target, binding };
            this.servicesCallbacks.forEach(f => f(bound));
        }
        return false;
    }

    private setServices(services?: WbCustomServices) {
        this.updateServicesBoundCallbacksAll(false); // unbind all
        this.services = services; // change
        this.updateServicesBoundCallbacksAll(true); // bind all
    }

    public purge() {
        this.resetServices();
        this.resetDevice();
        this.setGattServerDisconnectedCallback()
        this.deviceCallbacks = [];
        this.servicesCallbacks = [];
    }

}

type Reason<T> = { type: T, message: string; };

export type WbRejectedReason = Reason<"NONE" | "ERROR">;
export type WbDisconnectedReason = Reason<"NONE" | "ERROR" | "DELAYED" | "PERIPHERAL" | "CENTRAL">;

export type WbContext = {
    conn: WbConnection;
    rejectedReason: WbRejectedReason;
    disconnectedReason: WbDisconnectedReason;
};
