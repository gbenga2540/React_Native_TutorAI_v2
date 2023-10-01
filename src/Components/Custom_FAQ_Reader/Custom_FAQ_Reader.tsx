import React, { FunctionComponent, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { INTF_FAQ } from '../../Interface/FAQ/FAQ';
import DownArrowIcon from '../../Images/SVGs/Down_Arrow_Icon.svg';
import Colors from '../../Configs/Colors/Colors';
import TextDivider from '../Text_Divider/Text_Divider';
import BasicText from '../Basic_Text/Basic_Text';
import TextButton from '../Text_Button/Text_Button';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface CustomFAQReaderProps {
    faq: INTF_FAQ;
}
const CustomFAQReader: FunctionComponent<CustomFAQReaderProps> = ({ faq }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [openFAQ, setOpenFAQ] = useState<boolean>(false);

    const nav_to_sub_page = no_double_clicks({
        execFunc: () => {
            navigation.push(
                'HomeStack' as never,
                { screen: 'SubscriptionPage' } as never,
            );
        },
    });

    return (
        <View>
            {openFAQ ? (
                <TouchableOpacity
                    activeOpacity={0.55}
                    onPress={() => setOpenFAQ(!openFAQ)}
                    style={{
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: Colors.DarkBorder,
                        justifyContent: 'center',
                        borderRadius: 10,
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            minHeight: 50,
                            marginHorizontal: 20,
                            paddingVertical: 10,
                        }}>
                        <View
                            style={{
                                marginRight: 'auto',
                                flex: 1,
                            }}>
                            <BasicText
                                inputText={faq.faq_title}
                                textSize={15}
                                textWeight={700}
                            />
                        </View>
                        <View
                            style={{
                                marginLeft: 3,
                            }}>
                            <DownArrowIcon
                                style={{
                                    transform: [
                                        {
                                            rotate: '180deg',
                                        },
                                    ],
                                }}
                                color={Colors.Primary}
                            />
                        </View>
                    </View>
                    <TextDivider
                        singleLine
                        marginBottom={10}
                        marginHorizontal={18}
                    />
                    <Text
                        style={{
                            marginHorizontal: 22,
                            marginBottom: 16,
                            justifyContent: 'center',
                        }}>
                        <BasicText
                            inputText={faq.faq_body?.split('PAYMENT')?.[0]}
                            textSize={15}
                            textWeight={500}
                        />
                        <TextButton
                            buttonText="PAYMENT"
                            marginBottom={-3}
                            execFunc={nav_to_sub_page}
                        />
                        <BasicText
                            inputText={faq.faq_body?.split('PAYMENT')?.[1]}
                            textSize={15}
                            textWeight={500}
                        />
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    activeOpacity={0.55}
                    onPress={() => setOpenFAQ(!openFAQ)}
                    style={{
                        flexDirection: 'row',
                        minHeight: 56,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: Colors.DarkBorder,
                        alignItems: 'center',
                        borderRadius: 10,
                        paddingVertical: 10,
                    }}>
                    <View
                        style={{
                            flex: 1,
                            marginLeft: 20,
                            marginRight: 10,
                        }}>
                        <BasicText
                            inputText={faq.faq_title}
                            textSize={15}
                            textWeight={600}
                        />
                    </View>
                    <DownArrowIcon
                        style={{
                            marginLeft: 'auto',
                            marginRight: 20,
                        }}
                        color={Colors.Primary}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default CustomFAQReader;
