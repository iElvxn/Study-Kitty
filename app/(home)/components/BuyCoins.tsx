import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function BuyCoins() {

    const handleBuyCoins = () => {
        router.push('/buyCoins');
    }


    return (
        <TouchableOpacity 
            style={{
                backgroundColor: 'rgba(246, 197, 123, 0.95)',
                width: 35,
                height: 35,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
                borderColor: 'rgb(151, 111, 52)',
                borderWidth: 2,
            }}
            onPress={handleBuyCoins}
        >
            <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
    );
}