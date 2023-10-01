export interface INTF_AdminVar {
    __v?: number;
    _id?: string;
    facebook?: string;
    instagram?: string;
    mail?: string;
    twitter?: string;
    website?: string;
    whatsapp?: string;
    enable_paypal?: boolean;
    enable_stripe?: boolean;
    enable_flutterwave?: boolean;
    stripe_public_key?: string;
    flutterwave_public_key?: string;
    google_cloud_key?: string;
    price_for_plan_conversion?: number;
    grammar_prompt?: string;
    reading_prompt?: string;
    writing_prompt?: string;
    conversation_prompt?: string;
}
