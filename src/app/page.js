"use client";

import { ethers } from "ethers";
import ToDoContractABI from "../contract/ToDoContractABI.json";
import { useState, useEffect } from "react";
// import BigNumber from "bignumber.js";

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

  let signer = null;

  let provider;

  if (window.ethereum == undefined) {
    console.log("MetaMask not installed; using read-only defaults");
    provider = ethers.getDefaultProvider();
  } else {
    window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum));
    // provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
  }

  const initContract = () => {
    const todoContract = new ethers.Contract(
      "0x794Bd9510A8C987946077089C04EF56b954cb098",
      ToDoContractABI,
      provider
    ).connect(signer);
    return todoContract;
  };

  async function connectWallet() {
    console.log("Wallet connect status: ", connected);
    if (!connected) {
      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults");
        provider = ethers.getDefaultProvider();
      } else {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
      }
      console.log("here connecting");

      setConnected(true);
      getUserAddress();
      getWalletBalance();
      getMyTasks();
    }
  }

  async function getUserAddress() {
    const address = await signer.getAddress();
    updateAddress(address);
    return address;
  }

  // Define a function to fetch the balance of the signer's wallet address
  const getWalletBalance = async () => {
    try {
      const balance = await signer.getBalance();
      updateBalance(ethers.utils.formatEther(balance).toString());
    } catch (error) {
      console.error(error);
    }
  };
  const getMyTasks = async () => {
    try {
      const contract = initContract();
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
      setSharedTasks(tasks);
    } catch (error) {
      console.error(error);
    }
  };

  const onCreateNewTask = async () => {
    try {
      let contract = initContract();
      console.log(shareAddresses)
      // console.log(contract);
      // const taskName = "Bors Teas"; // Set your task name here
      // const sharedWith = ["0x5852231D8a00306A67DfB128AEd50c1573411d60"]; // Set addresses to share the task with here
      // contract.connect(signer);
      const tasks = await contract.createTask(newTaskName, shareAddresses);
      console.log(tasks);
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

  useEffect(() => {
    if (signer) {
      getUserAddress();
      getWalletBalance();
      getMyTasks();
      setConnected(true)
    } else {
      connectWallet()
      setConnected(true)
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <nav className="flex justify-between w-full mb-8">
        <div>My Address: {address}</div>
        <div>Balance: {balance}</div>
        <button className="btn" onClick={connectWallet}>
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
                <td className="border px-4 py-2">{ethers.BigNumber.from(task.id).toNumber()}</td>
                <td className="border px-4 py-2">{task.taskName}</td>
                <td className="border px-4 py-2">
                  {task.completed ? "Completed" : "Not Yet"}
                </td>
                <td className="border px-4 py-2">
                  {!task.completed ? (
                    <button
                      className="btn"
                      onClick={() => {
                        markOwnTaskAsDone(ethers.BigNumber.from(task.id).toNumber());
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
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-8 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Create New Task</h2>
            <form onSubmit={onCreateNewTask} className="flex flex-col">
              <input
                type="text"
                placeholder="Task Name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="input mb-2"
              />
              <input
                type="text"
                placeholder="List of Share Addresses (comma separated)"
                value={shareAddresses.join(",")}
                onChange={(e) =>
                  setShareAddresses(
                    e.target.value.split(",").map((address) => address.trim())
                  )
                }
                className="input mb-2"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn mr-2"
                  onClick={() => setShowCreateTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create Task
                </button>
              </div>
            </form>
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
            className="input mb-2"
          />
          <button className="btn" onClick={getSharedTasks}>
            Get Shared Tasks
          </button>
        </div>
        <table className="table-auto w-full mt-4">
          <thead>
            <tr>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Task Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </tr>
          </thead>
          <tbody>
            {sharedTasks.map((task, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{index}</td>
                <td className="border px-4 py-2">{task.taskName}</td>
                <td className="border px-4 py-2">
                  {task.completed ? "Completed" : "Not Yet"}
                </td>
                <td className="border px-4 py-2">
                  {!task.completed ? (
                    <button
                      className="btn"
                      onClick={() => {
                        markSharedTaskAsDone(ethers.BigNumber.from(task.id).toNumber());
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
    </main>
  );
}
