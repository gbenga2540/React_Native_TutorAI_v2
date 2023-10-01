import Axios from 'axios';
import { base_url } from '../Base/Base_URL';

const api_base_url = Axios.create({
    baseURL: base_url,
});

export const send_unsubscribe_reason = async ({
    userAuth,
    reason,
}: {
    userAuth: string;
    reason: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .post('unsubscribe/send-reason', { reason: reason }, headersConfig)
        .catch(err => {
            return {
                error: true,
                data: JSON.stringify(err?.response?.data || err?.message),
            };
        })
        .then((res: any) => {
            if (res?.error) {
                return {
                    error: true,
                    data: res?.data,
                };
            } else {
                if (res?.data?.error) {
                    return {
                        error: true,
                        data: res?.data,
                    };
                } else {
                    return {
                        error: false,
                        data: res?.data,
                    };
                }
            }
        });
};
