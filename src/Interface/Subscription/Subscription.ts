// export type INTF_PaymentPlan = 'plan_1' | 'plan_2' | 'plan_3';
export type INTF_PaymentPlan = string;

export interface INTF_Subscription {
    id: number;
    no_of_lessons: number;
    price: number;
    total_price: number;
    plan: INTF_PaymentPlan;
    thirty_mins: boolean;
    discount: number;
}
