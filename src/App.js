import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router} from 'react-router-dom';
import {Routes, Route} from 'react-router-dom';
import AuthPage from './page/auth/auth';
import HomePage from './page/home/home';

function App() {
  return (
    <Router>
      <div className='App'>
        <section>                              
            <Routes>                                    
               <Route path="/" element={<HomePage/>}/>
               <Route path="/auth" element={<AuthPage/>}/>
            </Routes>                    
        </section>
      </div>
    </Router>
  );
}

export default App;
