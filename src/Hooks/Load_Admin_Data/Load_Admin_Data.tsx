import { useQuery } from 'react-query';
import { get_admin_vars_data } from '../../Configs/Queries/Admin/Admin';
import { AdminStore } from '../../MobX/Admin/Admin';
import { useEffect } from 'react';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';

const LoadAdminData = async () => {
    const { data: adminData } = useQuery(
        QueryTags({}).AdminData,
        get_admin_vars_data,
        {
            refetchInterval: 5 * 60 * 1000,
            retry: 5,
            refetchIntervalInBackground: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
        },
    );

    useEffect(() => {
        const set_data = async () => {
            if (!adminData?.error) {
                AdminStore.set_admin_data({ data: adminData?.data });
            }
        };
        set_data();
    }, [adminData]);
};

export { LoadAdminData };
