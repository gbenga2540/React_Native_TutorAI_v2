import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import BackButton from '../../Components/Back_Button/Back_Button';
import CustomStatusBar from '../../Components/Custom_Status_Bar/Custom_Status_Bar';
import HeaderTab from '../../Sections/HC_Header_Tab/HC_Header_Tab';
import SearchBar from '../../Components/Search_Bar/Search_Bar';
import FAQReader from '../../Components/FAQ_Reader/FAQ_Reader';
import { contact_us } from '../../Data/Contact_Us/Contact_Us';
import ContactUsButton from '../../Components/Contact_Us_Button/Contact_Us_Button';
import { RouteProp, useRoute } from '@react-navigation/native';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { screen_height_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { INTF_FAQ, INTF_FAQTypes } from '../../Interface/FAQ/FAQ';
import CustomFAQReader from '../../Components/Custom_FAQ_Reader/Custom_FAQ_Reader';
import { AdminStore } from '../../MobX/Admin/Admin';
import { INTF_ContactUS } from '../../Interface/Contact_Us/Contact_Us';
import { QueryTags } from '../../Configs/Queries/Query_Tags/Query_Tags';
import { useQuery, useQueryClient } from 'react-query';
import { get_faqs } from '../../Configs/Queries/FAQs/FAQs';
import OverlaySpinner from '../../Components/Overlay_Spinner/Overlay_Spinner';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';
import BasicButton from '../../Components/Basic_Button/Basic_Button';

const HelpCenterPage: FunctionComponent = () => {
    const route = useRoute<RouteProp<any>>();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState<string>('');
    const [activeFAQ, setActiveFAQ] = useState<number>(0);
    const [faqs, setFAQs] = useState<INTF_FAQ[]>([]);
    const [newFAQs, setNewFAQs] = useState<INTF_FAQ[]>([]);

    const { data, isError, isLoading } = useQuery(
        QueryTags({}).FAQsData,
        get_faqs,
        {},
    );

    useEffect(() => {
        if (!data?.error || !isError || (data.data || [])?.length > 0) {
            setFAQs(data?.data);
        }
    }, [data, isError]);

    const faq_types = useCallback((): INTF_FAQTypes[] => {
        const tempFAQs: INTF_FAQTypes[] = ['All FAQs'];
        faqs?.map(item => {
            if (!tempFAQs.includes(item.faq_type)) {
                tempFAQs.push(item.faq_type as INTF_FAQTypes);
            }
        });
        return tempFAQs;
    }, [faqs]);

    const [currentTAB, setCurrentTAB] = useState<number>(
        route.params?.is_contact_page ? 2 : 1,
    );

    const refresh_data = no_double_clicks({
        execFunc: () => {
            queryClient.invalidateQueries(QueryTags({}).AdminData);
        },
    });

    useEffect(() => {
        if (faqs?.length > 0) {
            const faq_type: INTF_FAQTypes = faq_types()?.[activeFAQ];

            if (search) {
                if (faq_type === 'All FAQs') {
                    setNewFAQs([
                        ...faqs?.filter(item =>
                            item.faq_title
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                        ),
                    ]);
                } else {
                    setNewFAQs([
                        ...faqs?.filter(
                            item =>
                                item.faq_type === faq_type &&
                                item.faq_title
                                    .toLowerCase()
                                    .includes(search.toLowerCase()),
                        ),
                    ]);
                }
            } else {
                if (faq_type === 'All FAQs') {
                    setNewFAQs([...faqs]);
                } else {
                    setNewFAQs([
                        ...faqs?.filter(item => item.faq_type === faq_type),
                    ]);
                }
            }
        }
    }, [activeFAQ, search, faq_types, faqs]);

    return (
        <View style={styles.hcp_main}>
            <CustomStatusBar backgroundColor={Colors.Background} />
            <OverlaySpinner
                showSpinner={isLoading || faqs?.length === 0}
                hideBackButton
            />
            <View
                style={{
                    marginTop:
                        Platform.OS === 'ios'
                            ? screen_height_less_than({
                                  if_true: 45,
                                  if_false: 65,
                              })
                            : 25,
                    marginHorizontal: 22,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <BackButton />
                <BasicText
                    inputText={
                        currentTAB === 2
                            ? 'Contact Us'
                            : 'Frequently Asked Questions'
                    }
                    textWeight={700}
                    marginLeft={15}
                    textSize={20}
                />
            </View>
            <View
                style={{
                    minHeight: 50,
                    marginTop: 20,
                    marginBottom: 20,
                    marginHorizontal: 22,
                }}>
                <HeaderTab
                    header_1="FAQ"
                    header_2="Contact Us"
                    marginBetween={4}
                    execFunc_Header_1={() => setCurrentTAB(1)}
                    execFunc_Header_2={() => setCurrentTAB(2)}
                    secondIsInitialTab={currentTAB === 2}
                />
            </View>
            {currentTAB === 1 && (
                <View
                    style={{
                        flex: 1,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 20,
                                  })
                                : 5,
                    }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{
                            flexDirection: 'row',
                            marginBottom: 12,
                            marginHorizontal: 22,
                            maxHeight: 40,
                        }}>
                        {faq_types()?.map((item, index) => (
                            <TouchableOpacity
                                style={{
                                    borderWidth: activeFAQ !== index ? 1.3 : 0,
                                    height: 40,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingHorizontal: 13,
                                    marginRight: 12,
                                    borderRadius: 20,
                                    borderColor:
                                        activeFAQ !== index
                                            ? Colors.Primary
                                            : undefined,

                                    backgroundColor:
                                        activeFAQ === index
                                            ? Colors.Primary
                                            : Colors?.White,
                                }}
                                onPress={() => setActiveFAQ(index)}
                                key={index}>
                                <BasicText
                                    inputText={item}
                                    textColor={
                                        activeFAQ === index
                                            ? Colors.White
                                            : Colors.Primary
                                    }
                                    textWeight={500}
                                    textSize={15}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View
                        style={{
                            height: 56,
                            marginBottom: 5,
                            marginHorizontal: 22,
                        }}>
                        <SearchBar
                            inputValue={search}
                            setInputValue={setSearch}
                            placeHolderText="search"
                        />
                    </View>
                    <ScrollView
                        style={{
                            flex: 1,
                            marginHorizontal: 2,
                            paddingHorizontal: 22,
                            paddingTop: 20,
                        }}>
                        {newFAQs?.length > 0 ? (
                            newFAQs?.map((item, index) =>
                                item?.custom ? (
                                    <CustomFAQReader key={index} faq={item} />
                                ) : (
                                    <FAQReader key={index} faq={item} />
                                ),
                            )
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: 200,
                                }}>
                                <BasicText
                                    inputText="No Resource Found, Please Check All FAQs Tab!"
                                    textSize={17}
                                    width={260}
                                    textAlign="center"
                                />
                            </View>
                        )}
                        <View style={{ marginBottom: 50 }}>{''}</View>
                    </ScrollView>
                </View>
            )}
            {currentTAB === 2 && (
                <ScrollView
                    style={{
                        paddingHorizontal: 20,
                        marginHorizontal: 2,
                        marginBottom:
                            Platform.OS === 'ios'
                                ? screen_height_less_than({
                                      if_true: 10,
                                      if_false: 20,
                                  })
                                : 5,
                    }}>
                    {AdminStore.admin_data?._id || '' ? (
                        <>
                            {contact_us?.length > 0 &&
                                (contact_us as INTF_ContactUS[])
                                    ?.map(item => {
                                        if (item.name === 'Customer Support') {
                                            if (AdminStore.admin_data?.mail) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.mail,
                                                };
                                            }
                                        } else if (item.name === 'WhatsApp') {
                                            if (
                                                AdminStore.admin_data?.whatsapp
                                            ) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.whatsapp,
                                                };
                                            }
                                        } else if (item.name === 'Instagram') {
                                            if (
                                                AdminStore.admin_data?.instagram
                                            ) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.instagram,
                                                };
                                            }
                                        } else if (item.name === 'Facebook') {
                                            if (
                                                AdminStore.admin_data?.facebook
                                            ) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.facebook,
                                                };
                                            }
                                        } else if (item.name === 'Twitter') {
                                            if (
                                                AdminStore.admin_data?.twitter
                                            ) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.twitter,
                                                };
                                            }
                                        } else {
                                            if (
                                                AdminStore.admin_data?.website
                                            ) {
                                                return {
                                                    ...item,
                                                    url: AdminStore.admin_data
                                                        ?.website,
                                                };
                                            }
                                        }
                                    })
                                    ?.filter(c_item => c_item?.url)
                                    ?.map((item, index) => (
                                        <ContactUsButton
                                            contact_data={
                                                item as INTF_ContactUS
                                            }
                                            key={index}
                                        />
                                    ))}
                        </>
                    ) : (
                        <>
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 80,
                                }}>
                                <BasicText inputText="Please, click the button below to refresh page." />
                            </View>
                            <BasicButton
                                buttonText="Refresh"
                                marginHorizontal={22}
                                marginTop={50}
                                marginBottom={
                                    Platform.OS === 'ios'
                                        ? screen_height_less_than({
                                              if_true: 10,
                                              if_false: 40,
                                          })
                                        : 20
                                }
                                execFunc={() => refresh_data({})}
                            />
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

export default HelpCenterPage;

const styles = StyleSheet.create({
    hcp_main: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
});
