import Head from 'next/head';
import Image from 'next/image';
import Login from '../components/Login/Index';
import Sidebar from '../components/Home/Sidebar';
import Feed from '../components/Home/Feed/Index';
import Contacts from '../components/Home/Contacts/Index';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import axios from 'axios';
export default function Home({ posts }) {
  useEffect(() => {
    console.log(posts);
  }, []);
  return (
    <div className="bg-gray-100">
      <Head>
        <title>Facebook</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="w-full flex justify-between p-3">
        <Sidebar />
        <Feed posts={posts} />
        <Contacts />
      </main>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  try {
    // get server side cookies
    const token = req.cookies.token;
    let posts = await axios.get('http://localhost:3000/api/posts', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!posts.data) {
      return {
        notFound: true
      };
    }
    return {
      props: {
        posts: posts.data
      }
    };
  } catch (error) {
    console.log(error);
    return {
      props: {
        ok: false,
        reason:
          'some error description for your own consumption, not for client side'
      }
    };
  }
}
