import RouterProviderComponent from "./routes";
import { store } from "./toolkit/store/store";
import { Provider } from "react-redux";
import { SessionProvider } from "../src/app/context/SessionContext";

import "./index.css";
import "./app/globals.css";

const App = () => {
	return (
		<Provider store={store}>
			<SessionProvider>
				<RouterProviderComponent />
			</SessionProvider>
		</Provider>
	);
};

export default App;
