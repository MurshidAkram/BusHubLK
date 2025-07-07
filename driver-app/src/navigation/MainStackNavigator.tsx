// MainStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import DashboardScreen from '../screens/DashboardScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ConditionScreen from '../screens/ConditionScreen';
import TravelLogScreen from '../screens/TravelLogScreen';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
                headerShown: false,
            }}
        >
            {/* Tab Navigator as the main screen */}
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            
            {/* Stack screens that should be pushed on top of tabs */}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Condition" component={ConditionScreen} />
            <Stack.Screen name="TravelLog" component={TravelLogScreen} />
        </Stack.Navigator>
    );
};

export default MainStackNavigator;