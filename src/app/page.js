"use client";

import { ethers } from "ethers";
import ToDoContractABI from "../contract/ToDoContractABI.json";
import { useState, useEffect } from "react";
import React from "react";

export default function Home() {
  const [newTaskName, setNewTaskName] = useState("");
  const [shareAddresses, setShareAddresses] = useState([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [address, updateAddress] = useState("");
  const [balance, updateBalance] = useState("");
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [sharedTasks, setSharedTasks] = useState([]);
  const [taskCreatorAddress, setTaskCreatorAddress] = useState("");
  const [sharedTasksMap, setSharedTasksMap] = useState({});
  const [signers, setSigner] = useState(null);

  // let signer = null;

  let provider;

  const initContract = () => {
    const todoContract = new ethers.Contract(
      "0x15138a8Ab6B71AbC786F3EDae0B46a93F0Bd7B7f",
      ToDoContractABI,
      provider
    ).connect(signers);

    return todoContract;
  };

  async function connectWallet() {
    console.log("Wallet connect status: ", connected);
    if (!connected) {
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        setSigner(signer)
        setConnected(true);
        getUserAddress();
        getWalletBalance();
        getMyTasks();
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function getUserAddress() {
    const address = await signers.getAddress();
    updateAddress(address);
    return address;
  }

  // Define a function to fetch the balance of the signer's wallet address
  const getWalletBalance = async () => {
    try {
      const balance = await signers.getBalance();
      updateBalance(ethers.utils.formatEther(balance).toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getMyTasks = async () => {
    try {
      // const contract = new ethers.Contract(
      //   "0x15138a8Ab6B71AbC786F3EDae0B46a93F0Bd7B7f",
      //   ToDoContractABI,
      //   provider
      // ).connect(signer);
      let contract = initContract();
      const tasks = await contract.getMyTasks();
      console.log(tasks);
      setTasks(tasks);
    } catch (error) {
      console.error(error);
    }
  };

  const getSharedTasks = async () => {
    try {
      let contract = initContract();
      const tasks = await contract.getSharedTasks(taskCreatorAddress);
      console.log(tasks);
      const updatedSharedTasksMap = { ...sharedTasksMap }; // Create a copy of the current state
      updatedSharedTasksMap[taskCreatorAddress] = tasks; // Add or update shared tasks for the creator address
      setSharedTasksMap(updatedSharedTasksMap); // Update state
    } catch (error) {
      console.error(error);
    }
  };

  const onCreateNewTask = async () => {
    if (signers === null) {
      console.log("no signer");
      connectWallet();
      // signer = provider.getSigner();
    }
    // const contract = new ethers.Contract(
      //   "0x15138a8Ab6B71AbC786F3EDae0B46a93F0Bd7B7f",
      //   ToDoContractABI,
    //   provider
    // ).connect(signers);
    try {
      let contract = initContract();
      console.log(shareAddresses);
      let addresses = shareAddresses;
      if (addresses.length == 0) {
        addresses = [];
      }
      const tasks = await contract.createTask(newTaskName, addresses);
      console.log(tasks);
      setNewTaskName("");
      setShareAddresses([]);
      setShowCreateTaskModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const markOwnTaskAsDone = async (id) => {
    try {
      let contract = initContract();
      const markTaskDone = await contract.markAsCompleted(address, id);
      console.log(markTaskDone);
    } catch (error) {
      console.error(error);
    }
  };

  const markSharedTaskAsDone = async (id) => {
    try {
      let contract = initContract();
      const markTaskDone = await contract.markAsCompleted(
        taskCreatorAddress,
        id
      );
      console.log(markTaskDone);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   setContract(initContract());
  // }, [signer]);

  useEffect(() => {
    const { ethereum } = window;

    if (!ethereum) {
      provider = ethers.getDefaultProvider();
    } else {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setSigner(signer);
    }
    connectWallet();
    // if (signer === null) {
    //   connectWallet();
    // }
    getUserAddress();
    getWalletBalance();
    getMyTasks();
    setConnected(true);
  }, [signers]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <nav className="flex justify-between w-full mb-8">
        <div>My Address: {address}</div>
        <div>Balance: {balance}</div>
        <button
          className="btn"
          onClick={() => {
            connectWallet();
          }}
        >
          {connected ? "Connected" : "Connect Wallet"}
        </button>
      </nav>
      <div className="w-full">
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Task Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">
                  {ethers.BigNumber.from(task.id).toNumber()}
                </td>
                <td className="border px-4 py-2">{task.taskName}</td>
                <td className="border px-4 py-2">
                  {task.completed ? "Completed" : "Not Yet"}
                </td>
                <td className="border px-4 py-2">
                  {!task.completed ? (
                    <button
                      className="btn"
                      onClick={() => {
                        markOwnTaskAsDone(
                          ethers.BigNumber.from(task.id).toNumber()
                        );
                      }}
                    >
                      Mark As Complete
                    </button>
                  ) : (
                    <button className="btn" disabled>
                      Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <button className="btn" onClick={() => setShowCreateTaskModal(true)}>
          Create New Task
        </button>
      </div>
      {showCreateTaskModal && (
        <div
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75"
          style={{ zIndex: "9999" }}
        >
          <div className="bg-white p-8 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Create New Task</h2>
            <div className="flex flex-col">
              <h3 className="mb-2 p-5">Task Name </h3>
              <input
                type="text"
                placeholder="Task Name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="input mb-2 p-5"
              />
              <h3 className="mb-2 p-5">Share Address (Optional) </h3>
              <input
                type="text"
                placeholder="List of Share Addresses (comma separated)"
                value={shareAddresses.join(",")}
                onChange={(e) =>
                  setShareAddresses(
                    e.target.value.split(",").map((address) => address.trim())
                  )
                }
                className="input mb-2 p-5"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn mr-2"
                  onClick={() => setShowCreateTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    onCreateNewTask();
                  }}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-2">Shared Tasks</h2>
        <div className="w-full">
          <input
            type="text"
            placeholder="Task Creator's Address"
            value={taskCreatorAddress}
            onChange={(e) => setTaskCreatorAddress(e.target.value)}
            className="input mb-2 w-full"
          />
          <button
            className="btn"
            onClick={() => {
              getSharedTasks();
            }}
          >
            Get Shared Tasks
          </button>
        </div>
        <div className="w-full">
          <table className="table-auto w-full mt-4">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Task Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sharedTasksMap).map(([creatorAddress, tasks]) => (
                <React.Fragment key={creatorAddress}>
                  {/* Row indicating the creator's address */}
                  <tr>
                    <td colSpan="4" className="border px-4 py-2 font-bold">
                      Creator Address: {creatorAddress}
                    </td>
                  </tr>
                  {/* Render individual shared tasks */}
                  {tasks.map((task, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">
                        {ethers.BigNumber.from(task.id).toNumber()}
                      </td>
                      <td className="border px-4 py-2">{task.taskName}</td>
                      <td className="border px-4 py-2">
                        {task.completed ? "Completed" : "Not Yet"}
                      </td>
                      <td className="border px-4 py-2">
                        {!task.completed ? (
                          <button
                            className="btn"
                            onClick={() =>
                              markSharedTaskAsDone(
                                ethers.BigNumber.from(task.id).toNumber()
                              )
                            }
                          >
                            Mark As Complete
                          </button>
                        ) : (
                          <button className="btn" disabled>
                            Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
