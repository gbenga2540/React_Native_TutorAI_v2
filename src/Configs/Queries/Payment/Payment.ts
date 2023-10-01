import Axios from 'axios';
import { base_url } from '../Base/Base_URL';
import { INTF_PaymentPlan } from '../../../Interface/Subscription/Subscription';

const api_base_url = Axios.create({
    baseURL: base_url,
});

export const stripe_intent = async ({
    userPlan,
    userAuth,
}: {
    userPlan: INTF_PaymentPlan;
    userAuth: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .post(
            'payment/stripe-intent',
            {
                userPlan: userPlan,
            },
            headersConfig,
        )
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

export const paypal_intent = async ({
    userPlan,
    userAuth,
}: {
    userPlan: INTF_PaymentPlan;
    userAuth: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .post(
            'payment/paypal-intent',
            {
                userPlan: userPlan,
            },
            headersConfig,
        )
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

export const plan_upgrade_stripe_intent = async ({
    userAuth,
}: {
    userAuth: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .post('payment/plan-upgrade-stripe-intent', {}, headersConfig)
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

export const plan_upgrade_paypal_intent = async ({
    userAuth,
}: {
    userAuth: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .post('payment/plan-upgrade-paypal-intent', {}, headersConfig)
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

export const update_payment_history = async ({
    userAuth,
    ph_id,
}: {
    userAuth: string;
    ph_id: string;
}) => {
    const headersConfig = {
        headers: {
            'Content-Type': 'application/json',
            authorization: userAuth,
        },
    };
    return await api_base_url
        .patch('payment/update-payment-history', { ph_id }, headersConfig)
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
