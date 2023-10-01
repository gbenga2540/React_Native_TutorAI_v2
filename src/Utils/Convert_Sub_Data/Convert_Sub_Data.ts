export const convert_sub_data = ({
    data,
}: {
    data: {
        id?: number;
        no_of_lessons?: number;
        price?: number;
        plan?: string;
        _id?: string;
        thirty_mins?: boolean;
        discount?: number;
    }[];
}) => {
    if (data?.length > 0) {
        const subscription_data = data?.map(item => ({
            id: item.id,
            no_of_lessons: item.no_of_lessons,
            price: item.price,
            total_price: (item?.no_of_lessons || 0) * (item.price || 0),
            plan: item.plan,
            thirty_mins: item.thirty_mins,
            discount: item.discount,
        }));

        return subscription_data;
    } else {
        return [];
    }
};
