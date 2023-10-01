import { action, makeObservable, observable } from 'mobx';

class IOSPLockClass {
    p_lock: boolean = false;

    constructor() {
        makeObservable(this, {
            p_lock: observable,
            set_p_lock_on: action,
            set_p_lock_off: action,
        });
    }

    set_p_lock_on = () => {
        this.p_lock = true;
    };
    set_p_lock_off = () => {
        this.p_lock = false;
    };
}

export const IOSPLockStore = new IOSPLockClass();
