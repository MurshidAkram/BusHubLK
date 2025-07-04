import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from '../screens/DashboardScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ConditionScreen from '../screens/ConditionScreen';
import TravelLogScreen from '../screens/TravelLogScreen';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Condition" component={ConditionScreen} />
            <Stack.Screen name="TravelLog" component={TravelLogScreen} />
        </Stack.Navigator>
    );
};

export default MainStackNavigator;