import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Countdown, { calcTimeDelta, zeroPad } from 'react-countdown';
import './home.css';
import { Button, Card, Container, ListGroup, Nav, NavDropdown, Navbar, Table } from 'react-bootstrap';
import sanitize from 'sanitize-html';

const HomePage = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizResult, setQuizResult] = useState({
        countCorrect: 0,
        countIncorrect: 0,
        countAnswered: 0,
        remainingTime: 0,
    });
    const countdownApiRef = useRef(null);
    const [timer, setTimer] = useState(Date.now() + 30000);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [hasQuizHistory, setHasQuizHistory] = useState(false);
    const [isLoadQuiz, setIsLoadQuiz] = useState(false);

    const quizAmount = 10;

    const setRef = (countdown) => {
        if (countdown) {
            countdownApiRef.current = countdown.getApi();
        }
    };

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                navigate('/')
            } else {
                // User is signed out
                setUser(null);
                navigate('/auth')
            }
        });

        const prevQuiz = localStorage.getItem('prevQuiz');

        if (prevQuiz) {
            const parsedPrevQuiz = JSON.parse(prevQuiz);
            setQuizResult(parsedPrevQuiz);
            setHasQuizHistory(true);
        }
    }, [navigate])

    const handleLogout = () => {
        signOut(auth).then(() => {
            localStorage.clear();
            navigate("/auth");
        }).catch((error) => {
            alert('gagal logout')
        });
    }

    const startQuiz = () => {
        setIsLoadQuiz(true);
        fetch(`https://opentdb.com/api.php?amount=${quizAmount}`)
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                resetState();
                const newData = data['results'].map(obj => ({
                    ...obj,
                    "options": quizOptionsShuffle([...obj["incorrect_answers"], obj["correct_answer"]]),
                }));
                setQuizQuestions(newData);
                countdownApiRef.current && countdownApiRef.current.start();
            })
            .catch((e) => {
                alert('gagal mendapatkan data kuis')
            })
            .finally(() => {
                setIsLoadQuiz(false);
            });
    }

    useEffect(() => {
        const handleBeforeUnload = () => {
            localStorage.setItem('prevQuiz', JSON.stringify(quizResult));
            alert("menyimpan kusi terakhir")
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [quizResult]);

    useEffect(() => {
        if (quizResult.countAnswered === quizAmount || isTimeUp) {
            localStorage.setItem('prevQuiz', JSON.stringify(quizResult));
        }
    }, [quizResult, isTimeUp])

    const resetState = () => {
        setQuizIndex(0);
        setQuizQuestions([]);
        setQuizResult({
            countCorrect: 0,
            countIncorrect: 0,
            countAnswered: 0,
            remainingTime: 0,
        });
        setTimer(Date.now() + 30000);
        setIsTimeUp(false);
        setHasQuizHistory(false);
    }

    const handleClickAnswer = (answer) => {
        if (answer === quizQuestions[quizIndex]['correct_answer']) {
            setQuizResult((prevQuizResult) => ({
                ...prevQuizResult,
                countCorrect: prevQuizResult.countCorrect + 1,
                countAnswered: prevQuizResult.countAnswered + 1,
            }))
        } else {
            setQuizResult((prevQuizResult) => ({
                ...prevQuizResult,
                countIncorrect: prevQuizResult.countIncorrect + 1,
                countAnswered: prevQuizResult.countAnswered + 1,
            }))
        }

        if (quizIndex <= quizQuestions.length) {
            const nextIndex = quizIndex + 1;
            setQuizIndex(nextIndex);

            if (nextIndex === quizAmount) {
                countdownApiRef.current && countdownApiRef.current.pause();
            }
        }
    }

    const quizOptionsShuffle = (options) => {
        const optionsShuffle = options.sort(() => Math.random() - 0.5);
        return optionsShuffle;
    }

    const renderer = ({ total, hours, minutes, seconds, completed }) => {
        if (completed) {
            return <h5>Timesup</h5>
        } else {
            return <h5>{zeroPad(minutes)}:{zeroPad(seconds)}</h5>;
        }
    };

    const onTimeUp = () => {
        setIsTimeUp(true);
        setHasQuizHistory(true);
        setQuizResult((prevQuizResult) => ({
            ...prevQuizResult,
            remainingTime: 0,
        }));
    }

    const onPauseTimer = (remainingTime) => {
        setQuizResult((prevQuizResult) => ({
            ...prevQuizResult,
            remainingTime: remainingTime.total,
        }));
        setHasQuizHistory(true);
    }

    const onTickTimer = ({ total }) => {
        setQuizResult((prevQuizResult) => ({
            ...prevQuizResult,
            remainingTime: total,
        }));
    }

    const continueQuiz = () => {
        setIsLoadQuiz(true);
        fetch(`https://opentdb.com/api.php?amount=${quizAmount}`)
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                const newData = data['results'].map(obj => ({
                    ...obj,
                    "options": quizOptionsShuffle([...obj["incorrect_answers"], obj["correct_answer"]]),
                }));
                setQuizQuestions(newData);
                setTimer(Date.now() + quizResult.remainingTime);
                setQuizIndex(quizResult.countAnswered);
                countdownApiRef.current && countdownApiRef.current.start();
            })
            .catch((e) => {
                alert('gagal mendapatkan data kuis')
            })
            .finally(() => {
                setIsLoadQuiz(false);
            });
    }

    return (
        <main >
            <header>
                <Navbar className="bg-body-tertiary justify-content-between">
                    <Container>
                        <Navbar.Brand href="/"><h2>Quizaf</h2></Navbar.Brand>
                    </Container>
                    <Container className='justify-content-end'>
                        <Nav>
                            <NavDropdown title={user !== null ? user.displayName : "Hello"} id="nav-dropdown">
                                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Container>
                </Navbar>
            </header>
            <section>
                <div className={quizQuestions.length > quizIndex && !isTimeUp ? '' : 'hidden'}>
                    <Card className='m-4'>
                        <Card.Header className='d-flex justify-content-between'>
                            <h5>Number {quizIndex + 1}/{quizQuestions.length}</h5>
                            <Countdown
                                key={0}
                                ref={setRef}
                                date={timer}
                                autoStart={false}
                                renderer={renderer}
                                onComplete={onTimeUp}
                                onPause={onPauseTimer}
                                onTick={onTickTimer}
                            />
                        </Card.Header>
                        <Card.Body>
                            <Card.Title>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: sanitize(quizQuestions[quizIndex] === undefined
                                            ? ""
                                            : quizQuestions[quizIndex]["question"])
                                    }}
                                />

                            </Card.Title>
                        </Card.Body>
                        <ListGroup className="list-group-flush">
                            {
                                quizQuestions[quizIndex] === undefined
                                    ? ""
                                    : quizQuestions[quizIndex]["options"].map((val, index) => (
                                        <ListGroup.Item className='options-container' key={index} onClick={() => { handleClickAnswer(val) }}>
                                            {val}
                                        </ListGroup.Item>
                                    ))
                            }
                        </ListGroup>
                    </Card>
                </div>
                <div className={quizQuestions.length > quizIndex && !isTimeUp ? 'hidden' : ''}>
                    {
                        hasQuizHistory
                            ? <div>
                                <h2 className='text-center'>Previous Quiz</h2>
                                <Table size="sm" className='w-auto mx-auto'>
                                    <tbody>
                                        <tr>
                                            <td>Total Answered Quizzes</td>
                                            <td>{quizResult.countAnswered}/{quizAmount}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Correct Answers</td>
                                            <td>{quizResult.countCorrect}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Incorrect Answers</td>
                                            <td>{quizResult.countIncorrect}</td>
                                        </tr>
                                        <tr>
                                            <td>Remaining Time</td>
                                            <td>
                                                {zeroPad(calcTimeDelta(Date.now() + quizResult.remainingTime).minutes)} : {zeroPad(calcTimeDelta(Date.now() + quizResult.remainingTime).seconds)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                            : <div className='text-center'>
                                <h4>Welcome to Quizaf!</h4>
                                <h6>To begin the quiz, simply click on the "Start Quiz" button below. Let the fun begin!</h6>
                            </div>
                    }
                    {
                        quizResult.countAnswered < quizAmount && quizResult.remainingTime > 0
                            ? <div className='text-center'>
                                <h4>You have an unfinished quiz</h4>
                                <Button
                                    disabled={isLoadQuiz}
                                    onClick={!isLoadQuiz ? continueQuiz : null}
                                >
                                    {isLoadQuiz ? 'Loading…' : 'Continue Quiz'}
                                </Button>
                            </div>
                            : <div className='text-center'>
                                <Button
                                    disabled={isLoadQuiz}
                                    onClick={!isLoadQuiz ? startQuiz : null}
                                    variant="primary"
                                >
                                    {isLoadQuiz ? 'Loading…' : 'Start Quiz'}
                                </Button>
                            </div>
                    }
                </div>
            </section>
        </main>
    )
}

export default HomePage