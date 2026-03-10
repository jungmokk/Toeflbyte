import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home/Home';
import Test from '../screens/Test/Test';
import Chat from '../screens/Chat/Chat';
import Review from '../screens/Review/Review';
import ReviewDetail from '../screens/Review/ReviewDetail';
import VocabularyNote from '../screens/Review/VocabularyNote';
import Settings from '../screens/Settings/Settings';
import Login from '../screens/Auth/Login';
import Onboarding from '../screens/Home/Onboarding';
import Store from '../screens/Store/Store';
import { Home as HomeIcon, BookOpen, Settings as SettingsIcon } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#334155',
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'HomeTab') return <HomeIcon size={size} color={color} />;
          if (route.name === 'ReviewTab') return <BookOpen size={size} color={color} />;
          if (route.name === 'SettingsTab') return <SettingsIcon size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ title: '홈' }} />
      <Tab.Screen name="ReviewTab" component={Review} options={{ title: '오답 노트' }} />
      <Tab.Screen name="SettingsTab" component={Settings} options={{ title: '설정' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { session, setSession, setUserId, hasCompletedOnboarding } = useStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserId(session?.user?.id || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeThrough,
        }}
      >
        {!session ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <>
            {!hasCompletedOnboarding && (
              <Stack.Screen name="Onboarding" component={Onboarding} />
            )}
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Test" component={Test} />
            <Stack.Screen name="Chat" component={Chat} options={{ presentation: 'modal' }} />
            <Stack.Screen name="ReviewDetail" component={ReviewDetail} />
            <Stack.Screen name="VocabularyNote" component={VocabularyNote} />
            <Stack.Screen name="Store" component={Store} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
