import { action, makeObservable, observable } from 'mobx';
import { INTF_AdminVar } from '../../Interface/Admin/Admin';

class AdminClass {
    admin_data: INTF_AdminVar = {};

    constructor() {
        makeObservable(this, {
            admin_data: observable,
            set_admin_data: action,
        });
    }

    set_admin_data = ({ data }: { data: INTF_AdminVar }) => {
        this.admin_data = data;
    };
}

export const AdminStore = new AdminClass();
