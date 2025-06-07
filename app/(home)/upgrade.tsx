import { StyleSheet, Text, View } from "react-native";

export default function Upgrade() {
    return (
        <View style={styles.container}>
            <Text>Upgrade</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});