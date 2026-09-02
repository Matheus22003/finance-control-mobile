import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
export function Brand() { const c=palette[useColorScheme()??'light']; return <View accessibilityRole="header" style={s.wrap}><View style={[s.mark,{backgroundColor:c.primary}]}><View style={s.bar}/><View style={s.bar}/></View><Text style={[s.finance,{color:c.text}]}>Finance</Text><Text style={[s.control,{color:c.primary}]}>Control</Text></View>; }
const s=StyleSheet.create({wrap:{flexDirection:'row',alignItems:'center',gap:2},mark:{width:36,height:36,borderRadius:11,justifyContent:'center',gap:5,paddingHorizontal:8,marginRight:7},bar:{height:3,borderRadius:2,backgroundColor:'#fff'},finance:{fontFamily:'Inter_500Medium',fontSize:17},control:{fontFamily:'Inter_800ExtraBold',fontSize:17}});
