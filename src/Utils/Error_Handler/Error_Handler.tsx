import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface ErrorHandlerProps {
    navigation: NativeStackNavigationProp<any>;
    error_mssg: string;
    header_mssg?: string;
    svr_error_mssg?: string;
    show_sub?: boolean;
    switch_plans?: boolean;
}

export const error_handler = ({
    navigation,
    error_mssg,
    header_mssg,
    svr_error_mssg,
    show_sub,
    switch_plans,
}: ErrorHandlerProps) => {
    navigation.push(
        'ErrorPage' as never,
        {
            error_mssg: error_mssg,
            svr_error_mssg: svr_error_mssg,
            show_sub: show_sub,
            header_mssg: header_mssg,
            switch_plans: switch_plans,
        } as never,
    );
};
